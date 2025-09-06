/**
 * @test CameraComponent
 * @description Tests the CameraComponent for photo capture functionality, Capacitor plugin integration, and web fallback behavior
 * @prerequisites
 *   - Capacitor Camera plugin is mocked
 *   - File API is mocked for web fallback
 *   - Button component is available
 * @steps
 *   1. Mock Capacitor Camera plugin
 *   2. Test successful photo capture
 *   3. Test user cancellation
 *   4. Test web fallback behavior
 *   5. Test error handling
 *   6. Test component states
 * @expected Component handles all photo capture scenarios correctly with proper error handling and user feedback
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { CameraComponent } from '../CameraComponent';
import {
  mockCapacitorPlugins,
  mockPhoto,
  setPlatform,
  resetAllMocks
} from './mocks/capacitor-mocks';

// Import setup to ensure mocks are configured
import './mocks/setup-tests';

describe('CameraComponent', () => {
  const mockOnPhotoTaken = vi.fn();

  beforeEach(() => {
    resetAllMocks();
    mockOnPhotoTaken.mockClear();
  });

  describe('Native platform behavior', () => {
    beforeEach(() => {
      setPlatform('ios');
    });

    it('should successfully capture photo using Camera plugin', async () => {
      mockCapacitorPlugins.Camera.getPhoto.mockResolvedValue(mockPhoto);

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      expect(mockCapacitorPlugins.Camera.getPhoto).toHaveBeenCalledWith({
        quality: 90,
        allowEditing: true,
        resultType: 'base64',
        source: 'prompt',
      });

      await waitFor(() => {
        expect(mockOnPhotoTaken).toHaveBeenCalledWith(mockPhoto.base64String);
      });
    });

    it('should handle user cancellation gracefully', async () => {
      const cancelError = new Error('User cancelled photos app');
      mockCapacitorPlugins.Camera.getPhoto.mockRejectedValue(cancelError);

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      expect(mockCapacitorPlugins.Camera.getPhoto).toHaveBeenCalled();
      expect(mockOnPhotoTaken).not.toHaveBeenCalled();
      expect(screen.queryByText(/camera not available/i)).not.toBeInTheDocument();
    });

    it('should show loading state while taking photo', async () => {
      mockCapacitorPlugins.Camera.getPhoto.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPhoto), 100))
      );

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      expect(screen.getByText(/taking photo\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/taking photo\.\.\./i)).not.toBeInTheDocument();
      });
    });

    it('should handle camera plugin failure and show error', async () => {
      const pluginError = new Error('Camera plugin not available');
      mockCapacitorPlugins.Camera.getPhoto.mockRejectedValue(pluginError);

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/camera not available/i)).toBeInTheDocument();
      });
    });

    it('should allow retry after error', async () => {
      mockCapacitorPlugins.Camera.getPhoto
        .mockRejectedValueOnce(new Error('Camera error'))
        .mockResolvedValueOnce(mockPhoto);

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });

      // First attempt - should fail
      await userEvent.click(button);
      await waitFor(() => {
        expect(screen.getByText(/camera not available/i)).toBeInTheDocument();
      });

      // Second attempt - should succeed
      mockCapacitorPlugins.Camera.getPhoto.mockClear();
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockOnPhotoTaken).toHaveBeenCalledWith(mockPhoto.base64String);
      });
    });

    it('should apply custom className correctly', () => {
      mockCapacitorPlugins.Camera.getPhoto.mockResolvedValue(mockPhoto);

      render(
        <CameraComponent
          onPhotoTaken={mockOnPhotoTaken}
          className="custom-camera-class"
        />
      );

      const container = screen.getByRole('button', { name: /📷 take photo/i }).parentElement;
      expect(container).toHaveClass('custom-camera-class');
    });
  });

  describe('Web platform fallback behavior', () => {
    beforeEach(() => {
      setPlatform('web');
    });

    it('should trigger file input when Camera plugin fails', async () => {
      const pluginError = new Error('Plugin not available');
      mockCapacitorPlugins.Camera.getPhoto.mockRejectedValue(pluginError);

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      // Mock file input click
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');
      await userEvent.click(button);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('should handle file selection via fallback file input', async () => {
      mockCapacitorPlugins.Camera.getPhoto.mockRejectedValue(new Error('Plugin error'));

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      // Click button to trigger file input
      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      // Create and select file
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });

      // Trigger change event
      fireEvent.change(fileInput);

      await waitFor(() => {
        expect(mockOnPhotoTaken).toHaveBeenCalledWith('dGVzdC1pbWFnZS1kYXRh'); // base64 encoded 'test-image-data'
      });
    });

    it('should handle file selection with no file chosen', async () => {
      mockCapacitorPlugins.Camera.getPhoto.mockRejectedValue(new Error('Plugin error'));

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      // Trigger change event with no files
      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: false,
      });

      fireEvent.change(fileInput);

      expect(mockOnPhotoTaken).not.toHaveBeenCalled();
    });

    it('should handle FileReader error', async () => {
      mockCapacitorPlugins.Camera.getPhoto.mockRejectedValue(new Error('Plugin error'));

      // Mock FileReader error
      const originalFileReader = global.FileReader;
      class MockFileReader {
        result = null;
        onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
        onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

        readAsDataURL(file: File) {
          setTimeout(() => {
            if (this.onerror) {
              this.onerror.call(this, new ProgressEvent('error'));
            }
          }, 0);
        }
      }
      global.FileReader = MockFileReader as any;

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      Object.defineProperty(fileInput, 'files', {
        value: [testFile],
        writable: false,
      });

      fireEvent.change(fileInput);

      // Should not call onPhotoTaken due to FileReader error
      expect(mockOnPhotoTaken).not.toHaveBeenCalled();

      // Restore original FileReader
      global.FileReader = originalFileReader;
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle Camera plugin returning photo without base64String', async () => {
      const photoWithoutBase64 = {
        format: 'jpeg',
        webPath: 'test-path',
      };

      mockCapacitorPlugins.Camera.getPhoto.mockResolvedValue(photoWithoutBase64 as any);

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      expect(mockOnPhotoTaken).not.toHaveBeenCalled();
    });

    it('should handle unexpected error format', async () => {
      const unexpectedError = { code: 'UNKNOWN_ERROR' };
      mockCapacitorPlugins.Camera.getPhoto.mockRejectedValue(unexpectedError);

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText(/camera not available/i)).toBeInTheDocument();
      });
    });

    it('should be disabled during photo capture', async () => {
      mockCapacitorPlugins.Camera.getPhoto.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPhoto), 100))
      );

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      expect(button).toBeDisabled();
      expect(screen.getByText(/taking photo\.\.\./i)).toBeInTheDocument();

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with different camera sources', async () => {
      const cameraPhoto = { ...mockPhoto, webPath: 'camera://test' };
      const galleryPhoto = { ...mockPhoto, webPath: 'gallery://test' };

      mockCapacitorPlugins.Camera.getPhoto.mockResolvedValueOnce(cameraPhoto);
      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(mockOnPhotoTaken).toHaveBeenCalledWith(cameraPhoto.base64String);
      });

      // Test gallery photo
      mockOnPhotoTaken.mockClear();
      mockCapacitorPlugins.Camera.getPhoto.mockResolvedValueOnce(galleryPhoto);

      await userEvent.click(button);

      await waitFor(() => {
        expect(mockOnPhotoTaken).toHaveBeenCalledWith(galleryPhoto.base64String);
      });
    });

    it('should handle rapid button clicks', async () => {
      mockCapacitorPlugins.Camera.getPhoto.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPhoto), 200))
      );

      render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

      const button = screen.getByRole('button', { name: /📷 take photo/i });

      // Click multiple times rapidly
      await userEvent.click(button);
      await userEvent.click(button);
      await userEvent.click(button);

      // Should only trigger camera plugin once due to loading state
      expect(mockCapacitorPlugins.Camera.getPhoto).toHaveBeenCalledTimes(1);
    });
  });
});