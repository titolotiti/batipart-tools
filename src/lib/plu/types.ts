export interface PlanUrl {
  url: string;
  title: string;
  type?: string;
}

export interface Procedure {
  id: string;
  type: string;
  statut: string;
  dateApprobation?: string;
}

export interface DocumentsResult {
  success: boolean;
  address: string;
  coordinates: { lat: number; lon: number };
  citycode: string;
  city: string;
  zone: string;
  pluUrl: string | null;
  pluName: string | null;
  planUrls: PlanUrl[];
  ppri: boolean;
  ppriUrl?: string | null;
  sms: boolean;
  procedures: Procedure[];
  error?: string;
}

export interface PluSection {
  titre: string;
  statut: '✅' | '⚠️' | '❌' | '🗺️' | '❓';
  statut_label:
    | 'Applicable'
    | 'Sous conditions'
    | 'Non applicable'
    | 'À vérifier sur plan graphique'
    | 'Non trouvé dans le règlement écrit';
  resume: string;
  regle_principale: string;
  article: string;
  page: string;
  analyse_detaillee: string;
  citation: string;
  points_vigilance: string[];
  documents_a_consulter: Array<{
    reference: string;
    nom_document: string;
    raison: string;
    url: string | null;
  }>;
  source_manquante: string;
  action_recommandee: string;
}

export interface PluConclusion {
  points_bloquants: string[];
  conditions: string[];
  non_applicables: string[];
  sujets_a_verifier: string[];
  opportunites: string[];
  niveau_risque: string;
  synthese: string;
}

export interface PluAnalysisResult {
  success: boolean;
  address?: string;
  zone: string;
  pluName?: string | null;
  pluUrl?: string | null;
  analysisType: string;
  sections?: PluSection[];
  conclusion_operationnelle?: PluConclusion;
  documents_disponibles?: PlanUrl[];
  bodyTextSample?: string;
  error_code?: string;
  message?: string;
  error?: string;
  raw?: string;
}
