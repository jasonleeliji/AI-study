import React, { useState } from 'react';
import FeedbackModal from '../common/FeedbackModal';
import api from '../../services/api';

const MainLayout: React.FC = () => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  

  const handleFeedbackSubmit = async (content: string) => {
    await api.feedback.submit({ content });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ... existing code ... */}
      
      <FeedbackModal 
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};

export default MainLayout;