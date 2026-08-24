// Canonical designation values are lowercase (matching the DB), but the UI
// always displays the friendlier labels below.
export const DESIGNATION_LABELS = {
  ap: 'AP',
  hod: 'HOD',
  principal: 'Principal',
  campus_manager: 'Campus Manager',
  admin: 'Admin',
};

export function designationLabel(designation) {
  const normalizedDesignation = typeof designation === 'string' ? designation.trim().toLowerCase() : designation;
  return DESIGNATION_LABELS[normalizedDesignation] || designation;
}

export const PORTAL_LABELS = {
  ap: 'AP PORTAL',
  hod: 'HOD PORTAL',
  principal: 'PRINCIPAL PORTAL',
  campus_manager: 'CAMPUS MANAGER PORTAL',
  admin: 'ADMIN PORTAL',
};
