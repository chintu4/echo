/* @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MainPanel } from './main-panel';

describe('MainPanel', () => {
  it('renders Feed header', () => {
    render(
      <MemoryRouter>
        <MainPanel />
      </MemoryRouter>
    );
    expect(screen.getByText(/Feed/i)).toBeInTheDocument();
  });
});
