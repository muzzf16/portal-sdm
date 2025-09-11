import React from 'react';

const CssTest: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="display-4 text-primary mb-4">CSS Test Component</h1>
      <div className="bg-white p-4 rounded shadow">
        <p className="mb-2">This is a test to verify CSS is working correctly.</p>
        <p className="test-class">This text should be red, bold, and 20px.</p>
        <div className="mt-3 p-3 bg-primary-subtle rounded">
          <p className="text-primary-emphasis">This should have a light blue background with dark blue text.</p>
        </div>
        <button className="mt-3 btn btn-primary">
          This button should be blue
        </button>
      </div>
    </div>
  );
};

export default CssTest;