// Implementation 1: Iterative approach using a for loop
// Time Complexity: O(n), Space Complexity: O(1)
var sum_to_n_a = function(n) {
    if (n <= 0) return 0;
    
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

// Implementation 2: Mathematical formula approach
// Uses the arithmetic sequence sum formula: n*(n+1)/2
// Time Complexity: O(1), Space Complexity: O(1)
var sum_to_n_b = function(n) {
    if (n <= 0) return 0;
    
    return (n * (n + 1)) / 2;
};

// Implementation 3: Recursive approach
// Time Complexity: O(n), Space Complexity: O(n) due to call stack
var sum_to_n_c = function(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    
    return n + sum_to_n_c(n - 1);
};

// Export functions for testing purposes
export {
    sum_to_n_a,
    sum_to_n_b, 
    sum_to_n_c
};

// Example usage and verification:
console.log(sum_to_n_a(5)); // Output: 15
console.log(sum_to_n_b(5)); // Output: 15  
console.log(sum_to_n_c(5)); // Output: 15