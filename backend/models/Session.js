import mongoose from "mongoose";

const contextSchema = new mongoose.Schema(
  {
    patientName: { type: String, default: "" },
    disease: { type: String, default: "" },
    intent: { type: String, default: "" },
    location: { type: String, default: "" },
  },
  { _id: false }
);

const sourceErrorSchema = new mongoose.Schema(
  {
    source: { type: String, default: "" },
    message: { type: String, default: "" },
  },
  { _id: false }
);

const paperSchema = new mongoose.Schema(
  {
    source: { type: String, default: "" },
    title: { type: String, default: "" },
    authors: { type: String, default: "" },
    year: { type: String, default: "" },
    url: { type: String, default: "" },
    summary: { type: String, default: "" },
  },
  { _id: false }
);

const trialSchema = new mongoose.Schema(
  {
    source: { type: String, default: "" },
    title: { type: String, default: "" },
    status: { type: String, default: "" },
    location: { type: String, default: "" },
    eligibility: { type: String, default: "" },
    contact: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

const citationSchema = new mongoose.Schema(
  {
    id: { type: String, default: "" },
    title: { type: String, default: "" },
    authors: { type: String, default: "" },
    year: { type: String, default: "" },
    platform: { type: String, default: "" },
    url: { type: String, default: "" },
    snippet: { type: String, default: "" },
    type: { type: String, default: "" },
  },
  { _id: false }
);

const searchMetaSchema = new mongoose.Schema(
  {
    papersFound: { type: Number, default: 0 },
    openAlexFound: { type: Number, default: 0 },
    pubMedFound: { type: Number, default: 0 },
    trialsFound: { type: Number, default: 0 },
    totalPaperCandidates: { type: Number, default: 0 },
    openAlexCandidates: { type: Number, default: 0 },
    pubMedCandidates: { type: Number, default: 0 },
    trialCandidates: { type: Number, default: 0 },
    sourceErrors: { type: [sourceErrorSchema], default: [] },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    searchQuery: {
      type: String,
      default: "",
    },
    meta: {
      papersFound: { type: Number, default: 0 },
      trialsFound: { type: Number, default: 0 },
    },
  },
  { _id: false }
);

const searchRecordSchema = new mongoose.Schema(
  {
    query: { type: String, required: true, trim: true },
    searchQuery: { type: String, default: "" },
    context: { type: contextSchema, default: () => ({}) },
    answer: { type: String, default: "" },
    papers: { type: [paperSchema], default: [] },
    trials: { type: [trialSchema], default: [] },
    citations: { type: [citationSchema], default: [] },
    meta: { type: searchMetaSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    profile: {
      type: contextSchema,
      default: () => ({}),
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    searches: {
      type: [searchRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Session =
  mongoose.models.Session || mongoose.model("Session", sessionSchema);
