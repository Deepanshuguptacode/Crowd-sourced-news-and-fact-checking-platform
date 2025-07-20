// Test to check if the vote button click itself is causing issues
const testVoteClick = () => {
  console.log('Testing vote button click without any async operations');
  
  // Just log and show alert, no state updates
  console.log('Vote button clicked - no state change');
  alert('Vote button test - this should not cause blank screen');
};

// Add this temporarily to NewsCard to test if click handler is the issue
