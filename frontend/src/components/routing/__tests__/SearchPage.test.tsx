import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { SearchPage } from '../SearchPage';

// Mock the PageHeader component
vi.mock('../PageHeader', () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}));

// Mock the SearchResultCard component
vi.mock('../SearchResultCard', () => ({
  SearchResultCard: ({ result }: { result: any }) => (
    <div data-testid="search-result-card">
      <h3>{result.title}</h3>
      <p>{result.description}</p>
    </div>
  ),
}));

// Mock the SearchFilters component
vi.mock('../SearchFilters', () => ({
  SearchFilters: ({ filters, onFilterChange }: { filters: any[]; onFilterChange: Function }) => (
    <div data-testid="search-filters">
      <h3>Filters</h3>
      {filters.map((filter) => (
        <div key={filter.type}>
          <h4>{filter.label}</h4>
          {filter.options.map((option: any) => (
            <label key={option.value}>
              <input
                type="checkbox"
                onChange={(e) => onFilterChange(filter.type, option.value, e.target.checked)}
              />
              {option.label}
            </label>
          ))}
        </div>
      ))}
    </div>
  ),
}));

// Mock the SkeletonList component
vi.mock('../LoadingStates', () => ({
  SkeletonList: () => <div data-testid="skeleton-list">Loading...</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SearchPage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('renders the search page with initial state', () => {
    renderWithRouter(<SearchPage />);
    
    expect(screen.getByTestId('page-header')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search events, workspaces/i)).toBeInTheDocument();
    expect(screen.getByTestId('search-filters')).toBeInTheDocument();
  });

  it('displays search input and allows typing', () => {
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    fireEvent.change(searchInput, { target: { value: 'tech conference' } });
    
    expect(searchInput).toHaveValue('tech conference');
  });

  it('performs search when search button is clicked', async () => {
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(searchInput, { target: { value: 'tech conference' } });
    fireEvent.click(searchButton);
    
    // Should show loading state initially
    await waitFor(() => {
      expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
    });
    
    // Wait for results to load
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-list')).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('performs search when Enter key is pressed', async () => {
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    
    fireEvent.change(searchInput, { target: { value: 'tech conference' } });
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    // Should show loading state initially
    await waitFor(() => {
      expect(screen.getByTestId('skeleton-list')).toBeInTheDocument();
    });
  });

  it('saves search to recent searches', async () => {
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    fireEvent.change(searchInput, { target: { value: 'tech conference' } });
    fireEvent.click(searchButton);
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-list')).not.toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Check if search was saved to localStorage
    const recentSearches = JSON.parse(localStorage.getItem('searchRecent') || '[]');
    expect(recentSearches).toContain('tech conference');
  });

  it('displays no results message when no results found', async () => {
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Search for something that won't return results
    fireEvent.change(searchInput, { target: { value: 'nonexistent query xyz' } });
    fireEvent.click(searchButton);
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-list')).not.toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Should show no results message
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument();
    });
  });

  it('displays search results when results are found', async () => {
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    const searchButton = screen.getByRole('button', { name: /search/i });
    
    // Search for something that will return results
    fireEvent.change(searchInput, { target: { value: 'conference' } });
    fireEvent.click(searchButton);
    
    // Wait for search to complete
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-list')).not.toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Should show search results
    await waitFor(() => {
      expect(screen.getAllByTestId('search-result-card')).toHaveLength(3);
    });
  });

  it('updates URL with search query', () => {
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    
    fireEvent.change(searchInput, { target: { value: 'tech conference' } });
    
    // URL should be updated with query parameter (spaces can be encoded as + or %20)
    expect(window.location.search).toMatch(/q=tech(\+|%20)conference/);
  });

  it('loads search query from URL on mount', () => {
    // Set initial URL with query parameter
    window.history.pushState({}, '', '/search?q=initial%20query');
    
    renderWithRouter(<SearchPage />);
    
    const searchInput = screen.getByPlaceholderText(/search events, workspaces/i);
    expect(searchInput).toHaveValue('initial query');
  });
});