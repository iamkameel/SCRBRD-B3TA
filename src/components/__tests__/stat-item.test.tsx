
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { StatItem } from '../stat-item';

describe('StatItem', () => {
  it('renders the label and value correctly', () => {
    render(<StatItem label="Runs" value={123} />);
    
    expect(screen.getByText('Runs')).toBeInTheDocument();
    expect(screen.getByText('123')).toBeInTheDocument();
  });

  it('renders string values correctly', () => {
    render(<StatItem label="Best Bowling" value="4/25" />);
    
    expect(screen.getByText('Best Bowling')).toBeInTheDocument();
    expect(screen.getByText('4/25')).toBeInTheDocument();
  });

  it('applies additional class names', () => {
    render(<StatItem label="Test" value="Value" className="my-custom-class" />);
    
    // The component's root is a div, we find it by one of its children's text content.
    const statItemElement = screen.getByText('Test').parentElement;
    expect(statItemElement).toHaveClass('my-custom-class');
  });
});
