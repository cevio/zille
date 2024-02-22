export const NAMESPACE_META = 'META';
export const NAMESPACE_COMPONENT = 'COMPONENT';
export const ERROR_DUPLICATE = new Error('The object it depends on is relying on itself, please deal with the problem of duplicate dependencies.');
export const ERROR_CONFLICT = new Error('The method of destroying a service cannot be called while the service is being created.');