# Problem 3: Messy React - Code Analysis

## Overview

This document identifies computational inefficiencies and anti-patterns in the provided React/TypeScript code block, along with explanations of how to fix them.

---

## Issues Found

### 1. Critical Bug: Undefined Variable Reference

**Location:** Line 50
```ts
if (lhsPriority > -99) {
```

**Issue:** `lhsPriority` is referenced but never defined. The variable should be `balancePriority` which is defined on line 49.

**Impact:** Runtime `ReferenceError` - the application will crash.

**Fix:**
```ts
if (balancePriority > -99) {
```

---

### 2. Logic Error: Inverted Filter Condition

**Location:** Lines 50-54
```ts
if (lhsPriority > -99) {
   if (balance.amount <= 0) {
     return true;
   }
}
return false
```

**Issue:** The filter returns `true` when `balance.amount <= 0`, which means it keeps balances with zero or negative amounts and filters out positive amounts. This is backwards.

**Expected Behavior:** Filter OUT balances with amount <= 0.

**Fix:**
```ts
const balancePriority = getPriority(balance.blockchain);
return balancePriority > -99 && balance.amount > 0;
```

---

### 3. Missing Type Property

**Location:** Lines 12-15 (WalletBalance interface)
```ts
interface WalletBalance {
  currency: string;
  amount: number;
}
```

**Issue:** The interface is missing the `blockchain` property that's used throughout the code (`balance.blockchain` on lines 49, 57-58).

**Impact:** TypeScript compilation error.

**Fix:**
```ts
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}
```

---

### 4. Anti-Pattern: Using `any` Type

**Location:** Line 30
```ts
const getPriority = (blockchain: any): number => {
```

**Issue:** Using `any` defeats TypeScript's type safety. The function expects specific blockchain strings.

**Fix:** Use a union type or enum:
```ts
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';
const getPriority = (blockchain: Blockchain): number => {
```

---

### 5. Incorrect useMemo Dependency

**Location:** Line 65
```ts
}, [balances, prices]);
```

**Issue:** `prices` is included in the dependency array but is never used in the memoized computation. This causes unnecessary recalculations when prices change.

**Impact:** Performance degradation - `sortedBalances` is recalculated whenever prices update, even though prices aren't used in sorting/filtering.

**Fix:**
```ts
}, [balances]);
```

---

### 6. Performance Issue: Redundant getPriority Calls

**Location:** Lines 49, 57-58

**Issue:** `getPriority` is called multiple times for the same blockchain:
- Once during filtering (line 49)
- Twice during each sort comparison (lines 57-58)

For n items, sorting requires O(n log n) comparisons, resulting in O(n log n) redundant function calls.

**Fix:** Pre-compute priorities once:
```ts
const balancesWithPriority = balances.map(balance => ({
  ...balance,
  priority: getPriority(balance.blockchain)
}));
```

---

### 7. Incomplete Sort Comparator

**Location:** Lines 56-64
```ts
.sort((lhs: WalletBalance, rhs: WalletBalance) => {
  const leftPriority = getPriority(lhs.blockchain);
  const rightPriority = getPriority(rhs.blockchain);
  if (leftPriority > rightPriority) {
    return -1;
  } else if (rightPriority > leftPriority) {
    return 1;
  }
});
```

**Issue:** The sort function doesn't return `0` when priorities are equal - it returns `undefined`.

**Impact:** Unstable sorting behavior; results may vary across JavaScript engines.

**Fix:**
```ts
return rightPriority - leftPriority; // Simple subtraction handles all cases
```

---

### 8. Unused Variable / Double Iteration

**Location:** Lines 67-72 and 74-85
```ts
const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
  return {
    ...balance,
    formatted: balance.amount.toFixed()
  }
})

const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
```

**Issue:**
1. `formattedBalances` is created but never used
2. `rows` maps over `sortedBalances` (not `formattedBalances`) but types it as `FormattedWalletBalance`
3. `balance.formatted` will be undefined since we're mapping `WalletBalance`, not `FormattedWalletBalance`

**Impact:**
- Wasted computation creating unused array
- Runtime error accessing undefined `formatted` property
- Type mismatch

**Fix:** Remove `formattedBalances` and format inline:
```ts
const rows = sortedBalances.map((balance) => {
  const formattedAmount = balance.amount.toFixed();
  // ... use formattedAmount
});
```

---

### 9. Anti-Pattern: Using Array Index as React Key

**Location:** Line 79
```ts
key={index}
```

**Issue:** Using array index as key can cause rendering bugs when list order changes, items are added/removed, or items are reordered.

**Impact:**
- Incorrect component state preservation
- Poor reconciliation performance
- Visual glitches

**Fix:** Use a unique, stable identifier:
```ts
key={`${balance.blockchain}-${balance.currency}`}
```

---

### 10. Type Mismatch in Map Function

**Location:** Line 74
```ts
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
```

**Issue:** `sortedBalances` contains `WalletBalance` items, but the map function types them as `FormattedWalletBalance`. Then line 82 tries to access `balance.formatted` which doesn't exist.

**Impact:** Runtime error when accessing undefined property.

**Fix:** Use correct type and compute formatted value inline.

---

### 11. Undefined Variable: `classes`

**Location:** Line 78
```ts
className={classes.row}
```

**Issue:** `classes` is never defined or imported. This would typically come from a CSS-in-JS solution like Material-UI's `makeStyles`.

**Impact:** Runtime `ReferenceError`.

**Fix:** Import or define styles properly, or use Tailwind/CSS modules.

---

### 12. Redundant Type Annotation

**Location:** Line 25
```ts
const WalletPage: React.FC<Props> = (props: Props) => {
```

**Issue:** `(props: Props)` is redundant since `React.FC<Props>` already types the props parameter.

**Fix:**
```ts
const WalletPage: React.FC<Props> = (props) => {
// or better:
const WalletPage = (props: Props) => {
```

---

### 13. Empty Interface Extension

**Location:** Lines 22-24
```ts
interface Props extends BoxProps {

}
```

**Issue:** Empty interface that just extends another adds no value. It's unnecessary abstraction.

**Fix:** Use `BoxProps` directly or add actual properties:
```ts
const WalletPage: React.FC<BoxProps> = (props) => {
```

---

### 14. Unused Destructured Variable

**Location:** Line 26
```ts
const { children, ...rest } = props;
```

**Issue:** `children` is destructured but never used in the component.

**Impact:** Minor - unused code, but indicates potential missing functionality.

**Fix:** Remove if not needed, or render children if intended:
```ts
const { ...rest } = props;
// or
return <div {...rest}>{children}{rows}</div>
```

---

### 15. Missing Memoization for `rows`

**Location:** Lines 74-85

**Issue:** The `rows` array containing JSX elements is computed on every render without `useMemo`.

**Impact:**
- Creates new React elements on every render
- Triggers unnecessary reconciliation
- Performance degradation, especially with large lists

**Fix:**
```ts
const rows = useMemo(() => {
  return sortedBalances.map((balance) => {
    // ...
  });
}, [sortedBalances, prices]);
```

---

### 16. Potential Array Mutation

**Issue:** The `.sort()` method mutates the original array. While `filter()` creates a new array first, it's a good practice to be explicit about not mutating.

**Fix:** Use spread operator or `toSorted()`:
```ts
return [...balances]
  .filter(...)
  .sort(...);
```

---

## Summary

| Category | Count | Issues |
|----------|-------|--------|
| Critical Bugs | 2 | #1 (undefined variable), #11 (undefined classes) |
| Logic Errors | 2 | #2 (inverted filter), #7 (incomplete sort) |
| Type Errors | 4 | #3, #4, #10, #13 |
| Performance | 4 | #5, #6, #8, #15 |
| Anti-Patterns | 3 | #9 (index key), #12, #14 |
| Potential Issues | 1 | #16 (array mutation) |

**Total: 16 distinct issues**

---

## Refactored Version

See `refactored.tsx` for the improved implementation addressing all these issues.
