export interface BygglovData {
  municipalityId: string; // Configuration ID
  propertyDesignation: string; // e.g. "Stockholm Norrmalm 1:1"
  propertyArea: number; // m2
  
  technicalDescription: {
    constructionType: string; // e.g., "Wood Frame"
    foundationType: string; // e.g., "Concrete Slab"
    heatingSystem: string;
    ventilationSystem: string;
    waterSewage: 'municipal' | 'private';
  };

  // Metadata for drawings
  northDirection: number; // Degrees from vertical, for Situationsplan
  scale: number; // Preferred print scale
}

// Rules for area calculation
export type AreaType = 
  | 'BYA' // Byggnadsarea (Footprint)
  | 'BTA' // Bruttoarea (Gross Floor Area)
  | 'BOA' // Boarea (Living Area)
  | 'BIA'; // Biarea (Auxiliary Area)

export interface AreaResult {
  type: AreaType;
  value: number; // m2
  ruleVersion: string; // e.g. "SS 21054:2020"
}
