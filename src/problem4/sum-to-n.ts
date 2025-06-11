/**
 * Problem 4: Three implementations of sum to n function
 * Each function calculates the sum of integers from 1 to n
 * Example: sum_to_n(5) = 1 + 2 + 3 + 4 + 5 = 15
 */

/**
 * Implementation A: Iterative approach using a for loop
 * 
 * Complexity Analysis:
 * - Time Complexity: O(n) - We iterate through each number from 1 to n exactly once
 * - Space Complexity: O(1) - Only uses a constant amount of extra space (sum variable)
 * 
 * Efficiency Notes:
 * - Simple and intuitive approach
 * - Good for understanding the problem conceptually
 * - Linear time makes it inefficient for very large values of n
 * - Memory efficient as it uses constant space
 */
const sum_to_n_a = (n: number): number => {
    // Handle edge cases
    if (n <= 0) return 0;
    
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

/**
 * Implementation B: Mathematical formula approach
 * Uses the arithmetic series formula: n * (n + 1) / 2
 * 
 * Complexity Analysis:
 * - Time Complexity: O(1) - Constant time operation regardless of input size
 * - Space Complexity: O(1) - Uses constant amount of memory
 * 
 * Efficiency Notes:
 * - Most efficient solution in terms of both time and space
 * - Executes in constant time regardless of how large n is
 * - Uses mathematical insight to avoid iteration entirely
 * - Best choice for performance-critical applications
 * - Potential for floating-point precision issues with very large numbers
 */
const sum_to_n_b = (n: number): number => {
    // Handle edge cases
    if (n <= 0) return 0;
    
    // Apply arithmetic series formula: sum = n * (n + 1) / 2
    return (n * (n + 1)) / 2;
};

/**
 * Implementation C: Recursive approach
 * 
 * Complexity Analysis:
 * - Time Complexity: O(n) - Makes n recursive calls
 * - Space Complexity: O(n) - Each recursive call adds a frame to the call stack
 * 
 * Efficiency Notes:
 * - Elegant and follows the mathematical definition closely
 * - Less efficient than iterative due to function call overhead
 * - Risk of stack overflow for large values of n
 * - Uses more memory due to call stack accumulation
 * - Good for demonstrating recursive thinking but not practical for large inputs
 */
const sum_to_n_c = (n: number): number => {
    // Base cases
    if (n <= 0) return 0;
    if (n === 1) return 1;
    
    // Recursive case: n + sum of (n-1)
    return n + sum_to_n_c(n - 1);
};

/**
 * Test cases to verify all implementations work correctly
 */
const testCases = [0, 1, 5, 10, 100];

console.log('Testing all three implementations:');
console.log('=====================================');

testCases.forEach(n => {
    const resultA = sum_to_n_a(n);
    const resultB = sum_to_n_b(n);
    const resultC = sum_to_n_c(n);
    
    console.log(`n = ${n}:`);
    console.log(`  Implementation A (Iterative): ${resultA}`);
    console.log(`  Implementation B (Mathematical): ${resultB}`);
    console.log(`  Implementation C (Recursive): ${resultC}`);
    console.log(`  All results match: ${resultA === resultB && resultB === resultC}`);
    console.log('');
});

/**
 * Performance comparison for larger numbers
 * Note: Uncomment to test performance (be careful with recursive implementation for large n)
 */

const performanceTest = (n: number) => {
    console.log(`Performance test for n = ${n}:`);
    
    // Test Implementation A
    const startA = performance.now();
    const resultA = sum_to_n_a(n);
    const endA = performance.now();
    console.log(`Implementation A: ${endA - startA}ms, result: ${resultA}`);
    
    // Test Implementation B
    const startB = performance.now();
    const resultB = sum_to_n_b(n);
    const endB = performance.now();
    console.log(`Implementation B: ${endB - startB}ms, result: ${resultB}`);
    
    // Test Implementation C (only for smaller n to avoid stack overflow)
    if (n <= 10000) {
        const startC = performance.now();
        const resultC = sum_to_n_c(n);
        const endC = performance.now();
        console.log(`Implementation C: ${endC - startC}ms, result: ${resultC}`);
    } else {
        console.log('Implementation C: Skipped (risk of stack overflow)');
    }
};

performanceTest(1000);
performanceTest(10000);
performanceTest(100000);


// Export the functions for use in other modules
export { sum_to_n_a, sum_to_n_b, sum_to_n_c }; 