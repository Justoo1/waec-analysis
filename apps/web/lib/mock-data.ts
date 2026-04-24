// Mock data mirroring the design prototype — replace with real DB queries when available

export const SCHOOL = {
  name: "Archbishop Porter Girls' SHS",
  code: "0040103",
  location: "Takoradi, Western Region",
  year: 2025,
};

export const STATS = {
  totalCandidates: 909,
  qualifiers: 734,
  qualifyPct: 80.7,
  borderline: 75,
  borderlinePct: 8.3,
  noQualify: 100,
  noQualifyPct: 11.0,
  overallPassRate: 93.4,
  bestSubject: "Food & Nutrition",
  lastUpdated: "22 Apr 2025, 14:31",
};

export const GRADE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  A1: { bg: "#1A6B47", text: "#fff", label: "Distinction" },
  B2: { bg: "#2D8F5E", text: "#fff", label: "Credit" },
  B3: { bg: "#2D8F5E", text: "#fff", label: "Credit" },
  C4: { bg: "#2E7D7A", text: "#fff", label: "Credit" },
  C5: { bg: "#2E7D7A", text: "#fff", label: "Pass" },
  C6: { bg: "#2E7D7A", text: "#fff", label: "Pass" },
  D7: { bg: "#C07818", text: "#fff", label: "Borderline" },
  E8: { bg: "#B85C1A", text: "#fff", label: "Weak Fail" },
  F9: { bg: "#B83232", text: "#fff", label: "Fail" },
};

export const GRADE_ORDER = ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"] as const;

export type Grade = typeof GRADE_ORDER[number];

export type GradeCounts = Record<Grade, number>;

export interface Subject {
  name: string;
  code: string;
  cands: number;
  passRate: number;
  grades: GradeCounts;
}

export const SUBJECTS: Subject[] = [
  { name: "Food & Nutrition",   code: "FOOD",     cands: 120, passRate: 100.0, grades: { A1:45,B2:35,B3:25,C4:10,C5:3,C6:2,D7:0,E8:0,F9:0 } },
  { name: "ICT (Elective)",     code: "ICT",      cands: 85,  passRate: 100.0, grades: { A1:30,B2:25,B3:18,C4:8,C5:3,C6:1,D7:0,E8:0,F9:0 } },
  { name: "GKA",                code: "GKA",      cands: 62,  passRate: 100.0, grades: { A1:22,B2:18,B3:14,C4:6,C5:2,C6:0,D7:0,E8:0,F9:0 } },
  { name: "Chemistry",          code: "CHEM",     cands: 210, passRate: 99.0,  grades: { A1:50,B2:70,B3:60,C4:20,C5:5,C6:2,D7:1,E8:1,F9:1 } },
  { name: "CRS",                code: "CRS",      cands: 180, passRate: 97.6,  grades: { A1:55,B2:60,B3:45,C4:12,C5:3,C6:1,D7:1,E8:2,F9:1 } },
  { name: "English Language",   code: "ENG",      cands: 990, passRate: 96.8,  grades: { A1:41,B2:114,B3:402,C4:160,C5:106,C6:135,D7:9,E8:15,F9:8 } },
  { name: "Economics",          code: "ECON",     cands: 340, passRate: 95.6,  grades: { A1:60,B2:90,B3:110,C4:45,C5:20,C6:10,D7:3,E8:2,F9:0 } },
  { name: "Geography",          code: "GEO",      cands: 250, passRate: 94.4,  grades: { A1:35,B2:65,B3:80,C4:40,C5:15,C6:8,D7:3,E8:3,F9:1 } },
  { name: "Core Mathematics",   code: "CMATH",    cands: 990, passRate: 93.2,  grades: { A1:134,B2:106,B3:280,C4:148,C5:117,C6:138,D7:28,E8:25,F9:14 } },
  { name: "Social Studies",     code: "SOCSTUDY", cands: 990, passRate: 93.4,  grades: { A1:252,B2:142,B3:268,C4:116,C5:62,C6:85,D7:11,E8:22,F9:32 } },
  { name: "Integrated Science", code: "INTSC",    cands: 990, passRate: 90.9,  grades: { A1:80,B2:120,B3:300,C4:150,C5:130,C6:120,D7:40,E8:30,F9:20 } },
  { name: "Elec. Mathematics",  code: "EMATH",    cands: 190, passRate: 87.4,  grades: { A1:25,B2:50,B3:60,C4:30,C5:10,C6:5,D7:4,E8:4,F9:2 } },
  { name: "Accounting",         code: "ACCT",     cands: 135, passRate: 85.1,  grades: { A1:15,B2:30,B3:45,C4:20,C5:8,C6:3,D7:5,E8:5,F9:4 } },
  { name: "Sculpture",          code: "SCULPT",   cands: 30,  passRate: 86.7,  grades: { A1:5,B2:8,B3:10,C4:3,C5:0,C6:0,D7:1,E8:2,F9:1 } },
  { name: "French",             code: "FRE",      cands: 58,  passRate: 81.0,  grades: { A1:5,B2:12,B3:18,C4:8,C5:3,C6:1,D7:2,E8:5,F9:4 } },
  { name: "History",            code: "HIST",     cands: 108, passRate: 80.6,  grades: { A1:10,B2:25,B3:30,C4:15,C5:5,C6:2,D7:5,E8:8,F9:8 } },
  { name: "Costing",            code: "COST",     cands: 44,  passRate: 75.0,  grades: { A1:4,B2:8,B3:12,C4:6,C5:1,C6:2,D7:3,E8:4,F9:4 } },
];

export type CandidateStatus = "qualify" | "borderline" | "no-qualify";

export interface CandidateResult {
  s: string;
  g: Grade;
}

export interface Candidate {
  index: string;
  name: string;
  gender: "F" | "M";
  dob: string;
  status: CandidateStatus;
  passes: number;
  total: number;
  agg: number | null;
  programme: string;
  results: CandidateResult[];
}

export const CANDIDATES: Candidate[] = [
  { index:"0040103001", name:"ABABIO DAISY ASIEDUA",       gender:"F", dob:"09/11/2005", status:"no-qualify",  passes:4, total:8, agg:null, programme:"Business",
    results:[{s:"English Language",g:"C6"},{s:"Core Mathematics",g:"E8"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"D7"},{s:"Accounting",g:"F9"},{s:"Economics",g:"C5"},{s:"Costing",g:"F9"},{s:"History",g:"E8"}]},
  { index:"0040103002", name:"ABAKAH-GURA RACHEAL",         gender:"F", dob:"04/11/2007", status:"qualify",     passes:8, total:8, agg:12,   programme:"General Arts",
    results:[{s:"Social Studies",g:"B2"},{s:"English Language",g:"B3"},{s:"Core Mathematics",g:"C6"},{s:"Integrated Science",g:"B3"},{s:"Economics",g:"B3"},{s:"Geography",g:"A1"},{s:"Government",g:"A1"},{s:"Elec. Mathematics",g:"B3"}]},
  { index:"0040103003", name:"ABANKWAH GLORIA AKOSUA",      gender:"F", dob:"19/05/2006", status:"qualify",     passes:7, total:8, agg:14,   programme:"Science",
    results:[{s:"English Language",g:"B3"},{s:"Core Mathematics",g:"B2"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"B2"},{s:"Chemistry",g:"A1"},{s:"Elec. Mathematics",g:"C4"},{s:"Geography",g:"D7"},{s:"Physics",g:"B3"}]},
  { index:"0040103004", name:"ABBAN BEATRICE ESSUMANBA",    gender:"F", dob:"24/11/2006", status:"no-qualify",  passes:3, total:8, agg:null,  programme:"Business",
    results:[{s:"English Language",g:"D7"},{s:"Core Mathematics",g:"F9"},{s:"Social Studies",g:"C5"},{s:"Integrated Science",g:"E8"},{s:"Accounting",g:"F9"},{s:"Economics",g:"F9"},{s:"Costing",g:"F9"},{s:"History",g:"C4"}]},
  { index:"0040103005", name:"ABDUL HAMID IBADATU",          gender:"F", dob:"27/08/2007", status:"qualify",     passes:8, total:8, agg:10,   programme:"Science",
    results:[{s:"English Language",g:"A1"},{s:"Core Mathematics",g:"A1"},{s:"Social Studies",g:"B2"},{s:"Integrated Science",g:"A1"},{s:"Chemistry",g:"B2"},{s:"Elec. Mathematics",g:"A1"},{s:"Biology",g:"B3"},{s:"Physics",g:"B2"}]},
  { index:"0040103006", name:"ABOAGYE PRISCILLA OFORIWAA",  gender:"F", dob:"11/03/2006", status:"qualify",     passes:8, total:8, agg:18,   programme:"Home Economics",
    results:[{s:"English Language",g:"C4"},{s:"Core Mathematics",g:"C5"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"C4"},{s:"Food & Nutrition",g:"A1"},{s:"Management in Living",g:"B2"},{s:"GKA",g:"A1"},{s:"French",g:"C6"}]},
  { index:"0040103007", name:"ABORAH DIANA AKUA",            gender:"F", dob:"02/07/2006", status:"borderline",  passes:5, total:8, agg:null,  programme:"Business",
    results:[{s:"English Language",g:"C5"},{s:"Core Mathematics",g:"D7"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"C6"},{s:"Accounting",g:"C4"},{s:"Economics",g:"C5"},{s:"Costing",g:"E8"},{s:"History",g:"F9"}]},
  { index:"0040103008", name:"ACHAMPONG ABENA SERWAAH",      gender:"F", dob:"15/09/2006", status:"qualify",     passes:8, total:8, agg:15,   programme:"General Arts",
    results:[{s:"English Language",g:"B3"},{s:"Core Mathematics",g:"C4"},{s:"Social Studies",g:"A1"},{s:"Integrated Science",g:"B3"},{s:"CRS",g:"A1"},{s:"Geography",g:"B2"},{s:"History",g:"B3"},{s:"French",g:"C5"}]},
  { index:"0040103009", name:"ACQUAH JOSEPHINE ENAM",        gender:"F", dob:"30/01/2007", status:"qualify",     passes:8, total:8, agg:13,   programme:"Science",
    results:[{s:"English Language",g:"B2"},{s:"Core Mathematics",g:"A1"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"B2"},{s:"Chemistry",g:"B3"},{s:"Elec. Mathematics",g:"B2"},{s:"Biology",g:"B3"},{s:"Physics",g:"B3"}]},
  { index:"0040103010", name:"ADARKWA EUNICE ASANTE",        gender:"F", dob:"08/04/2006", status:"qualify",     passes:8, total:8, agg:20,   programme:"Business",
    results:[{s:"English Language",g:"C4"},{s:"Core Mathematics",g:"C6"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"C5"},{s:"Accounting",g:"B3"},{s:"Economics",g:"C4"},{s:"Costing",g:"C4"},{s:"ICT (Elective)",g:"B2"}]},
  { index:"0040103011", name:"ADDAE MAVIS OWUSUA",           gender:"F", dob:"22/06/2005", status:"qualify",     passes:8, total:8, agg:11,   programme:"Science",
    results:[{s:"English Language",g:"B2"},{s:"Core Mathematics",g:"A1"},{s:"Social Studies",g:"B2"},{s:"Integrated Science",g:"A1"},{s:"Chemistry",g:"A1"},{s:"Elec. Mathematics",g:"B3"},{s:"Biology",g:"B2"},{s:"Physics",g:"B3"}]},
  { index:"0040103012", name:"ADDO ABENA POMAA",             gender:"F", dob:"14/12/2006", status:"borderline",  passes:5, total:8, agg:null,  programme:"General Arts",
    results:[{s:"English Language",g:"C6"},{s:"Core Mathematics",g:"E8"},{s:"Social Studies",g:"C4"},{s:"Integrated Science",g:"D7"},{s:"CRS",g:"B3"},{s:"Geography",g:"C5"},{s:"History",g:"F9"},{s:"French",g:"C5"}]},
  { index:"0040103013", name:"AGYEI AKUA ACHIAA",            gender:"F", dob:"05/02/2007", status:"qualify",     passes:8, total:8, agg:16,   programme:"Visual Arts",
    results:[{s:"English Language",g:"C4"},{s:"Core Mathematics",g:"C5"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"C4"},{s:"Sculpture",g:"A1"},{s:"GKA",g:"B2"},{s:"Textiles",g:"B3"},{s:"Graphic Design",g:"C4"}]},
  { index:"0040103014", name:"AIDOO CHRISTIANA OFORIWAA",    gender:"F", dob:"17/10/2005", status:"qualify",     passes:8, total:8, agg:14,   programme:"Home Economics",
    results:[{s:"English Language",g:"B3"},{s:"Core Mathematics",g:"C4"},{s:"Social Studies",g:"B2"},{s:"Integrated Science",g:"B3"},{s:"Food & Nutrition",g:"B2"},{s:"Management in Living",g:"B3"},{s:"GKA",g:"B2"},{s:"French",g:"C5"}]},
  { index:"0040103015", name:"AMOAH GRACE AKOSUA",           gender:"F", dob:"29/03/2006", status:"no-qualify",  passes:4, total:8, agg:null,  programme:"Business",
    results:[{s:"English Language",g:"D7"},{s:"Core Mathematics",g:"F9"},{s:"Social Studies",g:"B3"},{s:"Integrated Science",g:"E8"},{s:"Accounting",g:"D7"},{s:"Economics",g:"C5"},{s:"Costing",g:"F9"},{s:"ICT (Elective)",g:"F9"}]},
];

export interface Programme {
  name: string;
  qualify: number;
  total: number;
  pct: number;
}

export const PROGRAMMES: Programme[] = [
  { name: "Science",        qualify: 185, total: 220, pct: 84.1 },
  { name: "Business",       qualify: 165, total: 210, pct: 78.6 },
  { name: "General Arts",   qualify: 198, total: 240, pct: 82.5 },
  { name: "Home Economics", qualify: 112, total: 130, pct: 86.2 },
  { name: "Visual Arts",    qualify: 74,  total: 109, pct: 67.9 },
];

export interface AggPoint {
  agg: number;
  count: number;
}

export const AGG_DISTRIBUTION: AggPoint[] = [
  {agg:6,count:12},{agg:7,count:28},{agg:8,count:45},{agg:9,count:62},{agg:10,count:78},
  {agg:11,count:90},{agg:12,count:85},{agg:13,count:72},{agg:14,count:60},{agg:15,count:55},
  {agg:16,count:48},{agg:17,count:40},{agg:18,count:32},{agg:19,count:25},{agg:20,count:20},
  {agg:21,count:15},{agg:22,count:10},{agg:23,count:8},{agg:24,count:6},
  {agg:25,count:14},{agg:26,count:10},{agg:27,count:8},{agg:28,count:6},{agg:29,count:5},{agg:30,count:4},
  {agg:31,count:8},{agg:32,count:6},{agg:33,count:4},{agg:34,count:3},{agg:36,count:5},
];

export interface BorderlineCandidate {
  index: string;
  name: string;
  missing: string;
  needed: Grade;
  currentGrade: Grade;
}

export const BORDERLINE_CANDIDATES: BorderlineCandidate[] = [
  { index:"0040103007", name:"ABORAH DIANA AKUA",       missing:"Core Mathematics", needed:"C6", currentGrade:"D7" },
  { index:"0040103012", name:"ADDO ABENA POMAA",         missing:"History",          needed:"C6", currentGrade:"F9" },
  { index:"0040103019", name:"AMPONSAH JANET AKUA",      missing:"Costing",          needed:"C5", currentGrade:"E8" },
  { index:"0040103031", name:"ANSAH COMFORT ASANTE",     missing:"French",           needed:"C6", currentGrade:"D7" },
  { index:"0040103044", name:"ASANTE AMMA TWUMWAA",      missing:"Accounting",       needed:"C4", currentGrade:"D7" },
];
