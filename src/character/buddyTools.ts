import { Mood } from "../types";

export interface BuddyReminder {
  reminderId: string;
  title: string;
  dueAt: string;
  createdAt: string;
  status: "pending" | "completed";
}

export interface BuddyNote {
  noteId: string;
  title: string;
  body: string;
  type: string;
  createdAt: string;
}

export interface BuddyListItem {
  itemId: string;
  listType: "shopping" | "needs";
  label: string;
  quantity: string;
  status: "pending" | "completed";
  createdAt: string;
}

export interface BuddyConcernSignal {
  concernId: string;
  type: string;
  summary: string;
  transcript: string;
  urgency: "low" | "medium" | "high";
  createdAt: string;
  status: "new" | "reviewed";
}

export interface BuddyEvent {
  eventId: string;
  buddyId: string;
  type: string;
  category: string;
  summary: string;
  transcript: string;
  urgency: "low" | "medium" | "high";
  requiresAdminAction: boolean;
  suggestedAction: string;
  createdAt: string;
  status: "queued" | "dispatched";
  metadata?: any;
}

export interface BuddyMemoryData {
  lastUserMessage: string;
  lastBuddyResponse: string;
  recentMoods: Mood[];
  recentMood: Mood[]; // Alias required by prompt
  recentTopic: string;
  recentTopics: string[]; // From prompt
  interactionCount: number;
  lastPositiveMoment: number | null;
  lastConfusedMoment: number | null;
  buddyRelationshipLevel: "Acquaintance" | "Good Buddy" | "Best Friend Forever";
  knownUserPreferences: Record<string, string>;
  preferences: Record<string, string>; // From prompt
  userName: string;
  importantPeople: string[];
  recurringNeeds: string[];
  routines: Record<string, { stepLabel: string; order: number; completed: boolean }[]>;
}

const MEMORY_STORAGE_KEY = "buddy_companion_memory_v1";
const REMINDERS_STORAGE_KEY = "buddy_reminders_v1";
const NOTES_STORAGE_KEY = "buddy_notes_v1";
const LIST_ITEMS_STORAGE_KEY = "buddy_list_items_v1";
const CONCERN_SIGNALS_STORAGE_KEY = "buddy_concern_signals_v1";
const EVENTS_STORAGE_KEY = "buddy_events_v1";

const DEFAULT_MEMORY: BuddyMemoryData = {
  lastUserMessage: "",
  lastBuddyResponse: "",
  recentMoods: [],
  recentMood: [],
  recentTopic: "",
  recentTopics: [],
  interactionCount: 0,
  lastPositiveMoment: null,
  lastConfusedMoment: null,
  buddyRelationshipLevel: "Acquaintance",
  knownUserPreferences: {},
  preferences: {},
  userName: "Friend",
  importantPeople: [],
  recurringNeeds: [],
  routines: {},
};

export class BuddyMemory {
  private data: BuddyMemoryData;
  private reminders: BuddyReminder[] = [];
  private notes: BuddyNote[] = [];
  private listItems: BuddyListItem[] = [];
  private concernSignals: BuddyConcernSignal[] = [];
  private events: BuddyEvent[] = [];

  constructor() {
    this.data = this.loadMemory();
    this.reminders = this.loadCollection<BuddyReminder>(REMINDERS_STORAGE_KEY);
    this.notes = this.loadCollection<BuddyNote>(NOTES_STORAGE_KEY);
    this.listItems = this.loadCollection<BuddyListItem>(LIST_ITEMS_STORAGE_KEY);
    this.concernSignals = this.loadCollection<BuddyConcernSignal>(CONCERN_SIGNALS_STORAGE_KEY);
    this.events = this.loadCollection<BuddyEvent>(EVENTS_STORAGE_KEY);
  }

  // --- Core Loading/Saving ---
  private loadMemory(): BuddyMemoryData {
    try {
      const stored = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...DEFAULT_MEMORY, ...parsed };
        // Ensure aliases are in sync
        merged.recentMood = merged.recentMoods || [];
        merged.preferences = merged.preferences || merged.knownUserPreferences || {};
        merged.recentTopics = merged.recentTopics || (merged.recentTopic ? [merged.recentTopic] : []);
        merged.importantPeople = merged.importantPeople || [];
        merged.recurringNeeds = merged.recurringNeeds || [];
        merged.routines = merged.routines || {};
        return merged;
      }
    } catch (e) {
      console.warn("Failed to load Buddy Memory from localStorage:", e);
    }
    return { ...DEFAULT_MEMORY };
  }

  private loadCollection<T>(key: string): T[] {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn(`Failed to load ${key} from localStorage:`, e);
    }
    return [];
  }

  public save(): void {
    try {
      // Sync aliases before saving
      this.data.recentMood = this.data.recentMoods;
      this.data.preferences = { ...this.data.knownUserPreferences, ...this.data.preferences };
      this.data.knownUserPreferences = this.data.preferences;

      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.data));
      localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(this.reminders));
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(this.notes));
      localStorage.setItem(LIST_ITEMS_STORAGE_KEY, JSON.stringify(this.listItems));
      localStorage.setItem(CONCERN_SIGNALS_STORAGE_KEY, JSON.stringify(this.concernSignals));
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(this.events));
    } catch (e) {
      console.warn("Failed to save Buddy data to localStorage:", e);
    }
  }

  public getData(): BuddyMemoryData {
    return this.data;
  }

  // --- getters for other collections ---
  public getReminders(): BuddyReminder[] {
    return this.reminders;
  }

  public getNotes(): BuddyNote[] {
    return this.notes;
  }

  public getListItems(): BuddyListItem[] {
    return this.listItems;
  }

  public getConcernSignals(): BuddyConcernSignal[] {
    return this.concernSignals;
  }

  public getEvents(): BuddyEvent[] {
    return this.events;
  }

  // --- Setters and mutations ---
  public addReminder(reminder: BuddyReminder): void {
    this.reminders.push(reminder);
    this.save();
  }

  public addNote(note: BuddyNote): void {
    this.notes.push(note);
    this.save();
  }

  public addListItem(item: BuddyListItem): void {
    this.listItems.push(item);
    this.save();
  }

  public addConcernSignal(signal: BuddyConcernSignal): void {
    this.concernSignals.push(signal);
    this.save();
  }

  public addEvent(event: BuddyEvent): void {
    this.events.push(event);
    this.save();
  }

  public toggleReminder(reminderId: string): void {
    const r = this.reminders.find(item => item.reminderId === reminderId);
    if (r) {
      r.status = r.status === "completed" ? "pending" : "completed";
      this.save();
    }
  }

  public toggleListItem(itemId: string): void {
    const i = this.listItems.find(item => item.itemId === itemId);
    if (i) {
      i.status = i.status === "completed" ? "pending" : "completed";
      this.save();
    }
  }

  public deleteReminder(reminderId: string): void {
    this.reminders = this.reminders.filter(item => item.reminderId !== reminderId);
    this.save();
  }

  public deleteNote(noteId: string): void {
    this.notes = this.notes.filter(item => item.noteId !== noteId);
    this.save();
  }

  public deleteListItem(itemId: string): void {
    this.listItems = this.listItems.filter(item => item.itemId !== itemId);
    this.save();
  }

  public updateInteraction(userMsg: string, buddyResp: string, mood: Mood): void {
    this.data.lastUserMessage = userMsg;
    this.data.lastBuddyResponse = buddyResp;
    this.data.interactionCount += 1;
    
    // Maintain a rolling window of recent moods
    this.data.recentMoods = [...this.data.recentMoods.slice(-4), mood];
    this.data.recentMood = this.data.recentMoods;

    // Detect user preferences or names dynamically from conversation
    this.extractPreferences(userMsg);

    // Update relationship level based on interaction count
    if (this.data.interactionCount > 30) {
      this.data.buddyRelationshipLevel = "Best Friend Forever";
    } else if (this.data.interactionCount > 10) {
      this.data.buddyRelationshipLevel = "Good Buddy";
    }

    this.save();
  }

  public markPositiveMoment(): void {
    this.data.lastPositiveMoment = Date.now();
    this.save();
  }

  public markConfusedMoment(): void {
    this.data.lastConfusedMoment = Date.now();
    this.save();
  }

  private extractPreferences(text: string): void {
    const lower = text.toLowerCase();
    
    // Name detection: "my name is X" or "call me X" or "i'm X"
    const namePatterns = [
      /my name is\s+([a-zA-Z0-9_-]+)/i,
      /call me\s+([a-zA-Z0-9_-]+)/i,
      /i am\s+([a-zA-Z0-9_-]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const detectedName = match[1].trim();
        if (detectedName.length > 1 && detectedName.toLowerCase() !== "buddy") {
          this.data.userName = detectedName;
          this.data.knownUserPreferences["userName"] = detectedName;
          this.data.preferences["userName"] = detectedName;
        }
      }
    }

    // Favorite things: "my favorite X is Y"
    const favMatch = text.match(/my favorite\s+([a-zA-Z0-9_-\s]+)\s+is\s+([a-zA-Z0-9_-\s]+)/i);
    if (favMatch && favMatch[1] && favMatch[2]) {
      const key = favMatch[1].trim().toLowerCase();
      const val = favMatch[2].trim();
      if (key.length < 30 && val.length < 50) {
        this.data.knownUserPreferences[`fav_${key}`] = val;
        this.data.preferences[`fav_${key}`] = val;
      }
    }

    // Likes/Dislikes: "i like X" or "i love X"
    if (lower.includes("i like ") || lower.includes("i love ")) {
      const hobbyMatch = text.match(/i (?:like|love)\s+([a-zA-Z0-9_-\s]+)/i);
      if (hobbyMatch && hobbyMatch[1]) {
        const hobby = hobbyMatch[1].trim();
        if (hobby.length > 2 && hobby.length < 30) {
          this.data.knownUserPreferences["hobby"] = hobby;
          this.data.preferences["hobby"] = hobby;
        }
      }
    }
  }

  public clear(): void {
    this.data = { ...DEFAULT_MEMORY };
    this.reminders = [];
    this.notes = [];
    this.listItems = [];
    this.concernSignals = [];
    this.events = [];
    this.save();
  }
}

export * from "./buddyToolDispatcher";

