// Integration tests for KPI Entry Form

import React from 'react';
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { 
  renderWithProviders, 
  mockApiService, 
  mockUser, 
  mockKPIScore,
  fillFormField,
  clickButton,
  selectOption,
  waitForApiCall,
  waitForLoadingToFinish,
  waitForErrorMessage,
  waitForSuccessMessage
} from '../utils/testHelpers';
import KPIEntryForm from '../../components/KPIEntryForm';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  apiService: mockApiService
}));

describe('KPI Entry Form Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering and Initialization', () => {
    it('should render KPI entry form with all required fields', () => {
      renderWithProviders(<KPIEntryForm />);

      // Check for all KPI metric fields
      expect(screen.getByLabelText(/TAT/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Major Negativity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Quality/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Neighbor Check/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/General Negativity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/App Usage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Insufficiency/i)).toBeInTheDocument();

      // Check for period selection
      expect(screen.getByLabelText(/Period/i)).toBeInTheDocument();

      // Check for submit button
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('should display real-time score calculation', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Fill in some KPI values
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');

      // Check if overall score is calculated and displayed
      await waitFor(() => {
        expect(screen.getByText(/Overall Score/i)).toBeInTheDocument();
        expect(screen.getByText(/75/i)).toBeInTheDocument(); // Expected calculated score
      });
    });

    it('should show trigger preview based on KPI values', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Fill in values that trigger training assignments
      fillFormField('TAT', '60');
      fillFormField('Major Negativity', '5');
      fillFormField('Quality', '70');
      fillFormField('Neighbor Check', '65');
      fillFormField('General Negativity', '35');
      fillFormField('App Usage', '80');
      fillFormField('Insufficiency', '3');

      // Check if trigger preview is shown
      await waitFor(() => {
        expect(screen.getByText(/Training Assignments/i)).toBeInTheDocument();
        expect(screen.getByText(/Basic Training/i)).toBeInTheDocument();
        expect(screen.getByText(/Negativity Handling/i)).toBeInTheDocument();
        expect(screen.getByText(/App Usage Training/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Try to submit without filling required fields
      clickButton('Submit KPI');

      await waitForErrorMessage('Please fill in all required fields');
    });

    it('should validate KPI score ranges', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Fill in invalid values
      fillFormField('TAT', '150'); // Invalid: > 100
      fillFormField('Major Negativity', '-5'); // Invalid: negative
      fillFormField('Quality', '200'); // Invalid: > 100

      clickButton('Submit KPI');

      await waitForErrorMessage('KPI scores must be between 0 and 100');
    });

    it('should validate period format', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Fill in valid KPI values
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');

      // Fill in invalid period
      fillFormField('Period', '2024-13'); // Invalid month

      clickButton('Submit KPI');

      await waitForErrorMessage('Period must be in YYYY-MM format');
    });

    it('should validate user selection', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Fill in valid KPI values
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');
      fillFormField('Period', '2024-03');

      // Don't select a user
      clickButton('Submit KPI');

      await waitForErrorMessage('Please select a user');
    });
  });

  describe('Form Submission', () => {
    it('should submit KPI data successfully', async () => {
      // Mock successful API response
      mockApiService.kpi.submitKPI.mockResolvedValue({
        success: true,
        data: mockKPIScore
      });

      renderWithProviders(<KPIEntryForm />);

      // Fill in all required fields
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');
      fillFormField('Period', '2024-03');

      // Select a user (assuming there's a user selection dropdown)
      selectOption('User', 'Test User');

      // Submit the form
      clickButton('Submit KPI');

      // Wait for API call
      await waitForApiCall(mockApiService.kpi.submitKPI);

      // Check for success message
      await waitForSuccessMessage('KPI score submitted successfully');
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      mockApiService.kpi.submitKPI.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<KPIEntryForm />);

      // Fill in all required fields
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');
      fillFormField('Period', '2024-03');

      selectOption('User', 'Test User');

      // Submit the form
      clickButton('Submit KPI');

      // Wait for error message
      await waitForErrorMessage('Failed to submit KPI score');
    });

    it('should show loading state during submission', async () => {
      // Mock delayed API response
      mockApiService.kpi.submitKPI.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ success: true, data: mockKPIScore }), 1000))
      );

      renderWithProviders(<KPIEntryForm />);

      // Fill in all required fields
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');
      fillFormField('Period', '2024-03');

      selectOption('User', 'Test User');

      // Submit the form
      clickButton('Submit KPI');

      // Check for loading state
      expect(screen.getByText(/Submitting/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled();

      // Wait for loading to finish
      await waitForLoadingToFinish();
    });
  });

  describe('Form Features', () => {
    it('should save form as draft', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Fill in some fields
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');

      // Save as draft
      clickButton('Save as Draft');

      // Check for success message
      await waitForSuccessMessage('Form saved as draft');
    });

    it('should reset form when reset button is clicked', () => {
      renderWithProviders(<KPIEntryForm />);

      // Fill in some fields
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');

      // Reset the form
      clickButton('Reset Form');

      // Check if fields are cleared
      expect(screen.getByLabelText(/TAT/i)).toHaveValue('');
      expect(screen.getByLabelText(/Major Negativity/i)).toHaveValue('');
      expect(screen.getByLabelText(/Quality/i)).toHaveValue('');
    });

    it('should load previous KPI data', async () => {
      // Mock API response for previous KPI data
      mockApiService.kpi.getUserKPI.mockResolvedValue({
        success: true,
        data: mockKPIScore
      });

      renderWithProviders(<KPIEntryForm />);

      // Click load previous data button
      clickButton('Load Previous KPI');

      // Wait for API call
      await waitForApiCall(mockApiService.kpi.getUserKPI);

      // Check if form is populated with previous data
      await waitFor(() => {
        expect(screen.getByLabelText(/TAT/i)).toHaveValue('85');
        expect(screen.getByLabelText(/Major Negativity/i)).toHaveValue('1');
        expect(screen.getByLabelText(/Quality/i)).toHaveValue('90');
      });
    });
  });

  describe('Bulk Entry Feature', () => {
    it('should handle bulk KPI entry', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Switch to bulk entry mode
      clickButton('Bulk Entry');

      // Check if bulk entry interface is shown
      expect(screen.getByText(/Bulk KPI Entry/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Upload CSV/i)).toBeInTheDocument();
    });

    it('should validate CSV file format', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Switch to bulk entry mode
      clickButton('Bulk Entry');

      // Create a mock CSV file
      const csvContent = 'User,TAT,Major Negativity,Quality\nTest User,85,1,90';
      const csvFile = new File([csvContent], 'test.csv', { type: 'text/csv' });

      // Upload the file
      const fileInput = screen.getByLabelText(/Upload CSV/i);
      fireEvent.change(fileInput, { target: { files: [csvFile] } });

      // Check if file is processed
      await waitFor(() => {
        expect(screen.getByText(/File uploaded successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Email Recipient Selection', () => {
    it('should show email recipient options', () => {
      renderWithProviders(<KPIEntryForm />);

      // Check if email recipient section is shown
      expect(screen.getByText(/Email Recipients/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Field Executive/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Coordinator/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Manager/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/HOD/i)).toBeInTheDocument();
    });

    it('should allow selecting multiple email recipients', () => {
      renderWithProviders(<KPIEntryForm />);

      // Select multiple recipients
      checkCheckbox('Field Executive');
      checkCheckbox('Coordinator');
      checkCheckbox('Manager');

      // Check if all are selected
      expect(screen.getByLabelText(/Field Executive/i)).toBeChecked();
      expect(screen.getByLabelText(/Coordinator/i)).toBeChecked();
      expect(screen.getByLabelText(/Manager/i)).toBeChecked();
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid form field changes', async () => {
      renderWithProviders(<KPIEntryForm />);

      const startTime = performance.now();

      // Rapidly change form fields
      for (let i = 0; i < 100; i++) {
        fillFormField('TAT', i.toString());
        fillFormField('Major Negativity', (i % 10).toString());
        fillFormField('Quality', (i % 100).toString());
      }

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('should handle large dataset in bulk entry', async () => {
      renderWithProviders(<KPIEntryForm />);

      // Switch to bulk entry mode
      clickButton('Bulk Entry');

      // Create a large CSV file
      const csvRows = Array.from({ length: 1000 }, (_, i) => 
        `User ${i},${Math.floor(Math.random() * 100)},${Math.floor(Math.random() * 10)},${Math.floor(Math.random() * 100)}`
      );
      const csvContent = 'User,TAT,Major Negativity,Quality\n' + csvRows.join('\n');
      const csvFile = new File([csvContent], 'large-test.csv', { type: 'text/csv' });

      const startTime = performance.now();

      // Upload the file
      const fileInput = screen.getByLabelText(/Upload CSV/i);
      fireEvent.change(fileInput, { target: { files: [csvFile] } });

      await waitFor(() => {
        expect(screen.getByText(/File uploaded successfully/i)).toBeInTheDocument();
      });

      const endTime = performance.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      mockApiService.kpi.submitKPI.mockRejectedValue(new Error('Network Error'));

      renderWithProviders(<KPIEntryForm />);

      // Fill in all required fields
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');
      fillFormField('Period', '2024-03');

      selectOption('User', 'Test User');

      // Submit the form
      clickButton('Submit KPI');

      // Wait for error message
      await waitForErrorMessage('Network error occurred. Please try again.');
    });

    it('should handle validation errors from server', async () => {
      // Mock server validation error
      mockApiService.kpi.submitKPI.mockRejectedValue({
        response: {
          data: {
            error: 'Duplicate KPI score for this period'
          }
        }
      });

      renderWithProviders(<KPIEntryForm />);

      // Fill in all required fields
      fillFormField('TAT', '85');
      fillFormField('Major Negativity', '1');
      fillFormField('Quality', '90');
      fillFormField('Neighbor Check', '80');
      fillFormField('General Negativity', '15');
      fillFormField('App Usage', '95');
      fillFormField('Insufficiency', '1');
      fillFormField('Period', '2024-03');

      selectOption('User', 'Test User');

      // Submit the form
      clickButton('Submit KPI');

      // Wait for error message
      await waitForErrorMessage('Duplicate KPI score for this period');
    });
  });
});
