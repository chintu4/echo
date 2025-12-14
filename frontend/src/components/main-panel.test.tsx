import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MainPanel } from './main-panel';

describe('MainPanel', () => {
  it('renders Feed header', () => {
    render(<MainPanel />);
    expect(screen.getByText(/Feed/i)).toBeInTheDocument();
  });
});
/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MainPanel } from './main-panel';

describe('MainPanel', () => {
    it('renders Feed heading', () => {
        render(<MainPanel />);
        expect(screen.getByText('Feed')).toBeDefined();
    });
});
