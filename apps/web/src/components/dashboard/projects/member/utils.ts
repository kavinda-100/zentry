import axios from 'axios';

export const DELETE_MEMBER_CONFIRMATION_TEXT = 'delete-member';

export const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const getInitials = (value?: string | null) => {
  if (!value) {
    return 'MB';
  }

  return value.slice(0, 2).toUpperCase();
};

export const getErrorMessage = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

export const stringifyPermissions = (permissions: unknown) => {
  if (permissions === null) {
    return '';
  }

  if (Array.isArray(permissions) && permissions.length === 0) {
    return '';
  }

  if (
    typeof permissions === 'object' &&
    permissions !== null &&
    !Array.isArray(permissions) &&
    Object.keys(permissions).length === 0
  ) {
    return '';
  }

  return JSON.stringify(permissions, null, 2);
};
