/**
 * Heading Hierarchy Validator
 * Validates HTML content for proper SEO heading structure (H1, H2, H3, H4, H5, H6)
 */

export interface HeadingNode {
  level: number;
  text: string;
  id?: string;
  position: number;
}

export interface HeadingValidationResult {
  isValid: boolean;
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  headings: HeadingNode[];
  h1Count: number;
  structure: string;
}

/**
 * Validates heading hierarchy in HTML content
 * @param htmlContent - HTML string to validate
 * @returns Validation result with score, errors, and warnings
 */
export function validateHeadingHierarchy(htmlContent: string): HeadingValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const headings: HeadingNode[] = [];

  // Extract all headings (h1-h6)
  const headingRegex = /<h([1-6])([^>]*)>(.*?)<\/h\1>/gi;
  let match;
  let position = 0;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1]);
    const attributes = match[2];
    const text = match[3].replace(/<[^>]*>/g, '').trim(); // Remove inner HTML tags

    // Extract id if present
    const idMatch = attributes.match(/id=["']([^"']+)["']/);
    const id = idMatch ? idMatch[1] : undefined;

    headings.push({
      level,
      text,
      id,
      position: position++
    });
  }

  // Count H1 tags
  const h1Count = headings.filter(h => h.level === 1).length;

  // Rule 1: Exactly one H1
  if (h1Count === 0) {
    errors.push('No H1 tag found. Every article must have exactly one H1 tag for the main title.');
  } else if (h1Count > 1) {
    errors.push(`Multiple H1 tags found (${h1Count}). Articles should have exactly one H1 tag.`);
  }

  // Rule 2: H1 should be first or near the beginning
  if (headings.length > 0 && headings[0].level !== 1 && h1Count === 1) {
    warnings.push('H1 should typically be the first heading in the document.');
  }

  // Rule 3: Check for skipped levels
  for (let i = 1; i < headings.length; i++) {
    const prev = headings[i - 1];
    const curr = headings[i];

    const levelDiff = curr.level - prev.level;

    // Skipping more than 1 level down is not allowed
    if (levelDiff > 1) {
      errors.push(
        `Heading level skipped from H${prev.level} to H${curr.level} at position ${i + 1}. ` +
        `Heading "${curr.text}" should be H${prev.level + 1} or lower.`
      );
    }
  }

  // Rule 4: H2 tags should exist for main sections
  const h2Count = headings.filter(h => h.level === 2).length;
  if (h2Count === 0 && headings.length > 1) {
    warnings.push('No H2 tags found. Use H2 tags for main content sections.');
  } else if (h2Count < 3 && headings.length > 4) {
    warnings.push('Consider using more H2 tags to break content into clear sections (recommended: 4-7 sections).');
  }

  // Rule 5: Check for H2 tags with ids for navigation
  const h2WithIds = headings.filter(h => h.level === 2 && h.id).length;
  if (h2Count > 0 && h2WithIds === 0) {
    warnings.push('H2 tags should have id attributes for table of contents navigation (e.g., <h2 id="section-1">).');
  }

  // Rule 6: Check for orphan deep headings (H4+ without parent H3)
  for (let i = 0; i < headings.length; i++) {
    const curr = headings[i];

    if (curr.level >= 4) {
      // Look back to find appropriate parent
      let hasParent = false;
      for (let j = i - 1; j >= 0; j--) {
        if (headings[j].level === curr.level - 1) {
          hasParent = true;
          break;
        }
        // Stop if we hit a heading at same or lower level
        if (headings[j].level <= curr.level - 2) {
          break;
        }
      }

      if (!hasParent) {
        errors.push(
          `H${curr.level} heading "${curr.text}" found without parent H${curr.level - 1}. ` +
          `Heading hierarchy should be continuous.`
        );
      }
    }
  }

  // Calculate score (0-100)
  let score = 100;

  // Deductions
  score -= errors.length * 15; // -15 points per error
  score -= warnings.length * 5; // -5 points per warning

  // Bonus for good structure
  if (h1Count === 1) score += 10;
  if (h2Count >= 4 && h2Count <= 7) score += 10;
  if (h2WithIds >= h2Count * 0.8) score += 5; // 80% of H2s have ids

  // Ensure score is in valid range
  score = Math.max(0, Math.min(100, score));

  // Generate structure visualization
  const structure = generateStructureVisualization(headings);

  return {
    isValid: errors.length === 0,
    score,
    errors,
    warnings,
    headings,
    h1Count,
    structure
  };
}

/**
 * Generates a visual representation of heading structure
 */
function generateStructureVisualization(headings: HeadingNode[]): string {
  if (headings.length === 0) return 'No headings found';

  const lines: string[] = [];

  for (const heading of headings) {
    const indent = '  '.repeat(heading.level - 1);
    const id = heading.id ? ` [#${heading.id}]` : '';
    lines.push(`${indent}H${heading.level}${id}: ${heading.text}`);
  }

  return lines.join('\n');
}

/**
 * Auto-fix common heading hierarchy issues
 * @param htmlContent - HTML string to fix
 * @returns Fixed HTML content
 */
export function autoFixHeadingHierarchy(htmlContent: string): string {
  let fixed = htmlContent;

  // Extract all headings
  const headings: Array<{ level: number; fullMatch: string; text: string; position: number }> = [];
  const headingRegex = /<h([1-6])([^>]*)>(.*?)<\/h\1>/gi;
  let match;

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      fullMatch: match[0],
      text: match[3],
      position: match.index
    });
  }

  // Fix: If no H1, convert first heading to H1
  if (headings.length > 0 && headings.every(h => h.level !== 1)) {
    const firstHeading = headings[0];
    const newH1 = firstHeading.fullMatch.replace(/^<h\d/, '<h1').replace(/<\/h\d>$/, '</h1>');
    fixed = fixed.replace(firstHeading.fullMatch, newH1);
  }

  // Fix: Remove extra H1s (convert to H2)
  let h1Count = 0;
  for (const heading of headings) {
    if (heading.level === 1) {
      h1Count++;
      if (h1Count > 1) {
        const newH2 = heading.fullMatch.replace(/^<h1/, '<h2').replace(/<\/h1>$/, '</h2>');
        fixed = fixed.replace(heading.fullMatch, newH2);
      }
    }
  }

  return fixed;
}

/**
 * Extract table of contents from H2 headings
 * @param htmlContent - HTML string
 * @returns Array of TOC items with id and text
 */
export function extractTableOfContents(htmlContent: string): Array<{ id: string; text: string }> {
  const toc: Array<{ id: string; text: string }> = [];
  const h2Regex = /<h2([^>]*)>(.*?)<\/h2>/gi;
  let match;

  while ((match = h2Regex.exec(htmlContent)) !== null) {
    const attributes = match[1];
    const text = match[2].replace(/<[^>]*>/g, '').trim();

    const idMatch = attributes.match(/id=["']([^"']+)["']/);
    if (idMatch) {
      toc.push({
        id: idMatch[1],
        text
      });
    }
  }

  return toc;
}
