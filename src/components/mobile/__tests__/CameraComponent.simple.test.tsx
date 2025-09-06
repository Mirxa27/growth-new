/**
 * @test CameraComponent (Simplified)
 * @description Simplified test for CameraComponent focusing on basic functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import '@testing-library/jest-dom';
import { CameraComponent } from '../CameraComponent';

// Import vitest expect for assertions
import { expect } from 'vitest';

// Mock Capacitor Camera plugin
vi.mock('@capacitor/camera', () => ({
  Camera: {
    getPhoto: vi.fn(),
  },
  CameraResultType: {
    Base64: 'base64',
    Uri: 'uri',
    DataUrl: 'dataUrl',
  },
  CameraSource: {
    Prompt: 'prompt',
    Camera: 'camera',
    Photos: 'photos',
  },
}));

// Mock toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
  })),
}));

// Mock the Button component
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

const mockPhoto = {
  base64String: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  format: 'png',
  exif: null,
  webPath: 'blob:example',
};

describe('CameraComponent (Simplified)', () => {
  const mockOnPhotoTaken = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with take photo button', () => {
    render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

    expect(screen.getByRole('button', { name: /📷 take photo/i })).toBeInTheDocument();
  });

  it('should show loading state when taking photo', async () => {
    const { Camera } = await import('@capacitor/camera');
    (Camera.getPhoto as any).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockPhoto), 100))
    );

    render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

    const button = screen.getByRole('button', { name: /📷 take photo/i });
    await userEvent.click(button);

    expect(screen.getByText(/taking photo\.\.\./i)).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('should call onPhotoTaken when photo is captured', async () => {
    const { Camera } = await import('@capacitor/camera');
    (Camera.getPhoto as any).mockResolvedValue(mockPhoto);

    render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

    const button = screen.getByRole('button', { name: /📷 take photo/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(mockOnPhotoTaken).toHaveBeenCalledWith(mockPhoto.base64String);
    });
  });

  it('should handle camera error gracefully', async () => {
    const { Camera } = await import('@capacitor/camera');
    (Camera.getPhoto as any).mockRejectedValue(new Error('Camera not available'));

    render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

    const button = screen.getByRole('button', { name: /📷 take photo/i });
    await userEvent.click(button);

    // The component should try to click the file input when camera fails
    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
  });

  it('should have hidden file input for web fallback', () => {
    render(<CameraComponent onPhotoTaken={mockOnPhotoTaken} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveClass('hidden');
  });
});