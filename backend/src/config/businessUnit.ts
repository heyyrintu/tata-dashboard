/**
 * Business unit derived from the material description.
 *
 * The MIS has no BU column - the tag is embedded in the material text, either
 * as an explicit "- PVBU" / "CVBU-" marker or implicitly through the HP and
 * Genuine DEF product lines, which belong to HCL. Order matters: an explicit
 * tag always wins, because "CVBU- TATA GENUINE 20 LTR BUCKET" carries both.
 */

export const BUSINESS_UNITS = ['PVBU', 'CVBU', 'HCL', 'Untagged'] as const;
export type BusinessUnit = (typeof BUSINESS_UNITS)[number];

export function businessUnitOf(material: string | null | undefined): BusinessUnit {
  if (!material) return 'Untagged';
  const m = material.toUpperCase();

  if (m.includes('PVBU')) return 'PVBU';
  if (m.includes('CVBU')) return 'CVBU';
  if (m.includes('HP') || m.includes('GENUINE')) return 'HCL';

  return 'Untagged';
}
