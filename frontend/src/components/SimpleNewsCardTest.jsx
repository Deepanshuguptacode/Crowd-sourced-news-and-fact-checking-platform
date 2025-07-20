// Simple NewsCard test to isolate the voting issue
import React, { useState } from 'react';

const SimpleNewsCardTest = () => {
  const [upvotes, setUpvotes] = useState(5);
  const [downvotes, setDownvotes] = useState(2);
  
  const handleVote = async (voteType) => {
    console.log('Vote clicked:', voteType);
    
    try {
      // Simulate the same logic as the real component
      console.log('Before vote - upvotes:', upvotes, 'downvotes:', downvotes);
      
      if (voteType === 'upvote') {
        setUpvotes(prev => {
          console.log('Updating upvotes from', prev, 'to', prev + 1);
          return prev + 1;
        });
      } else {
        setDownvotes(prev => {
          console.log('Updating downvotes from', prev, 'to', prev + 1);
          return prev + 1;
        });
      }
      
      console.log('Vote completed successfully');
      
    } catch (error) {
      console.error('Vote error:', error);
    }
  };

  console.log('Rendering SimpleNewsCardTest - upvotes:', upvotes, 'downvotes:', downvotes);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Simple Vote Test</h3>
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button 
          onClick={() => handleVote('upvote')}
          style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          👍 {upvotes}
        </button>
        <button 
          onClick={() => handleVote('downvote')}
          style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          👎 {downvotes}
        </button>
      </div>
    </div>
  );
};

export default SimpleNewsCardTest;
