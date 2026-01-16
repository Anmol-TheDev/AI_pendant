import { EventEmitter } from 'expo-modules-core';

type ToastType = 'success' | 'error' | 'info';

interface ToastEvent {
  message: string;
  type: ToastType;
}

class ToastEmitter {
  private listeners: ((event: ToastEvent) => void)[] = [];

  emit(type: ToastType, message: string) {
    this.listeners.forEach(listener => listener({ type, message }));
  }

  show(message: string) {
    this.emit('info', message);
  }

  success(message: string) {
    this.emit('success', message);
  }

  error(message: string) {
    this.emit('error', message);
  }

  subscribe(listener: (event: ToastEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const toast = new ToastEmitter();
