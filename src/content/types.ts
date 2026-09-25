import type { EvidenceStatus, OperationKind } from "../core/types";

export interface SourceRecord {
  id:string;
  title:string;
  publisher:string;
  url:string;
  publishedOn:string;
  accessedOn:string;
}

export interface HistoricalEventRecord {
  id:string;
  date:string;
  title:string;
  summary:string;
  status:EvidenceStatus;
  sourceIds:string[];
  tags:string[];
  playable:boolean;
  anchorFlag?:string;
}

export interface HistoricalOperationTemplate {
  id:string;
  eventId:string;
  kind:OperationKind;
  title:string;
  location:string;
  suggestedBudget:number;
  targetProgress:number;
  startingMediaAttention:number;
  startingLegalRisk:number;
  startingPublicMomentum:number;
}

