export const LOADING_STATES = {
  LOADING: 'Loading...',
  LOADING_TASKS: 'Loading tasks...',
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
} as const;

export const EMPTY_STATES = {
  NO_TASKS: 'No tasks yet',
} as const;

export const CONFIRMATION_MESSAGES = {
  DELETE_TASK: 'Are you sure you want to delete this task?',
  DELETE_TASK_TITLE: 'Delete Task',
  DELETE_TASK_MESSAGE: 'Are you sure you want to delete this task? This action cannot be undone.',
  DELETE_TASK_CONFIRM: 'Delete task',
  DELETE_TASK_CANCEL: 'Keep task',
  UNSAVED_CHANGES_TITLE: 'Discard changes',
  UNSAVED_CHANGES_MESSAGE: 'You have unsaved changes. Are you sure you want to leave without saving?',
  UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
  UNSAVED_CHANGES_CONFIRM: 'Discard',
  UNSAVED_CHANGES_CANCEL: 'Keep editing',
} as const;

export const TASK_MODAL_MESSAGES = {
  CREATE_TITLE: 'Create',
  CREATE_DESCRIPTION: 'Add a new task to the dashboard',
  CREATE_CONFIRM: 'Create',
  EDIT_TITLE: 'Edit',
  EDIT_DESCRIPTION: 'Update the selected task',
  EDIT_CONFIRM: 'Save',
  CANCEL: 'Cancel',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  TASK_NOT_FOUND: 'Task not found or access denied',
  FETCH_TASKS_FAILED: 'Failed to fetch tasks',
  CREATE_TASK_FAILED: 'Failed to create task',
  UPDATE_TASK_FAILED: 'Failed to update task',
  DELETE_TASK_FAILED: 'Failed to delete task',
  UNEXPECTED_ERROR: 'An unexpected error occurred',
  SOMETHING_WRONG: 'Something went wrong',
} as const;

export const SUCCESS_MESSAGES = {
  TASK_CREATED: 'Task created successfully',
  TASK_UPDATED: 'Task updated successfully',
  TASK_DELETED: 'Task deleted successfully',
} as const;
