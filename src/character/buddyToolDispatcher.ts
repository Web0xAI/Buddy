import { Mood } from "../types";
import {
  BuddyMemory,
  BuddyReminder,
  BuddyNote,
  BuddyListItem,
  BuddyConcernSignal,
  BuddyEvent
} from "./buddyTools";

export interface ExecutedToolAction {
  tool: string;
  args: any;
  result: string;
  timestamp: string;
}

// Global log of recent tool execution for debugging
let recentExecutedTools: ExecutedToolAction[] = [];

export function getRecentExecutedTools(): ExecutedToolAction[] {
  return recentExecutedTools;
}

export function clearRecentExecutedTools(): void {
  recentExecutedTools = [];
}

/**
 * Parses user input for common phrases / intents (lightweight rule-based detector)
 */
export function detectUserIntents(transcript: string, memory: BuddyMemory): ExecutedToolAction[] {
  const actions: ExecutedToolAction[] = [];
  const lower = transcript.toLowerCase().trim();
  const timestamp = new Date().toISOString();

  // 1. Remember Preference ("remember that X")
  if (lower.startsWith("remember that")) {
    const content = transcript.replace(/remember that/i, "").trim();
    if (content.length > 2) {
      // Try to parse "A is B"
      const isMatch = content.match(/^(.*?)\s+is\s+(.*)$/i);
      let key = "fact";
      let value = content;
      if (isMatch && isMatch[1] && isMatch[2]) {
        key = isMatch[1].trim().toLowerCase();
        value = isMatch[2].trim();
      }

      const data = memory.getData();
      data.preferences[key] = value;
      data.knownUserPreferences[key] = value;
      memory.save();

      actions.push({
        tool: "remember_preference",
        args: { key, value },
        result: `Successfully saved preference: "${key}" = "${value}"`,
        timestamp,
      });
    }
  }

  // 2. Reminders ("remind me to X at Y")
  if (lower.includes("remind me to") || lower.includes("remind me")) {
    const remindMatch = transcript.match(/remind me\s+(?:to\s+)?([^,.]+?)(?:\s+(?:at|on|tomorrow|in|by)\s+([^,.]+))?$/i);
    if (remindMatch && remindMatch[1]) {
      const title = remindMatch[1].trim();
      const dueAt = remindMatch[2] ? remindMatch[2].trim() : "Later today";

      const reminder: BuddyReminder = {
        reminderId: `rem_${Math.random().toString(36).substr(2, 9)}`,
        title,
        dueAt,
        createdAt: timestamp,
        status: "pending",
      };
      memory.addReminder(reminder);

      actions.push({
        tool: "create_reminder",
        args: { title, dueAt },
        result: `Created local reminder: "${title}" due at "${dueAt}"`,
        timestamp,
      });
    }
  }

  // 3. Needs & Shopping ("I need X", "I'm out of X", "add X to my list")
  let itemToAdd: string | null = null;
  let itemQty = "1";
  let isShopping = false;

  if (lower.startsWith("i need ") || lower.startsWith("i'm out of ") || lower.startsWith("im out of ")) {
    itemToAdd = transcript.replace(/i need|i'm out of|im out of/i, "").trim();
    isShopping = true;
  } else if (lower.includes("add ") && lower.includes(" to my list")) {
    const addMatch = transcript.match(/add\s+(?:(\d+)\s+)?(.*?)\s+to my list/i);
    if (addMatch && addMatch[2]) {
      itemQty = addMatch[1] || "1";
      itemToAdd = addMatch[2].trim();
      isShopping = true;
    }
  }

  if (itemToAdd && itemToAdd.length > 2 && isShopping) {
    // Sanitize itemToAdd (remove articles etc.)
    const cleanItem = itemToAdd.replace(/^(a|an|some|more)\s+/i, "").trim();
    if (cleanItem.length > 1) {
      const newItem: BuddyListItem = {
        itemId: `item_${Math.random().toString(36).substr(2, 9)}`,
        listType: "shopping",
        label: cleanItem,
        quantity: itemQty,
        status: "pending",
        createdAt: timestamp,
      };
      memory.addListItem(newItem);

      // Add to recurring needs/preferences as well for complete tracking
      if (!memory.getData().recurringNeeds.includes(cleanItem)) {
        memory.getData().recurringNeeds.push(cleanItem);
        memory.save();
      }

      actions.push({
        tool: "add_shopping_item",
        args: { label: cleanItem, quantity: itemQty },
        result: `Added "${cleanItem}" (qty: ${itemQty}) to local shopping list`,
        timestamp,
      });

      // Also generate a buddy event queue record for future admin synchronization
      const event: BuddyEvent = {
        eventId: `evt_${Math.random().toString(36).substr(2, 9)}`,
        buddyId: "buddy_carrier_v1",
        type: "shopping",
        category: "shopping",
        summary: `User noted a need for ${cleanItem}`,
        transcript,
        urgency: "low",
        requiresAdminAction: true,
        suggestedAction: "Verify shopping items or coordinate restocking.",
        createdAt: timestamp,
        status: "queued",
      };
      memory.addEvent(event);
    }
  }

  // 4. Routine Helper ("add X to my morning/bedtime routine")
  if (lower.includes("routine")) {
    const routineMatch = transcript.match(/add\s+(.*?)\s+to my\s+([a-zA-Z0-9_-]+)\s+routine/i);
    if (routineMatch && routineMatch[1] && routineMatch[2]) {
      const stepLabel = routineMatch[1].trim();
      const routineType = routineMatch[2].toLowerCase().trim();

      const routines = memory.getData().routines;
      if (!routines[routineType]) {
        routines[routineType] = [];
      }
      const order = routines[routineType].length + 1;
      routines[routineType].push({ stepLabel, order, completed: false });
      memory.save();

      actions.push({
        tool: "create_routine_step",
        args: { routineType, stepLabel, order },
        result: `Added step "${stepLabel}" to routine "${routineType}"`,
        timestamp,
      });
    }
  }

  // 5. Concern Signals ("I don't know what to do", "I forgot everything")
  const triggersOfDistress = [
    "i don't know what to do",
    "i dont know what to do",
    "i forgot where i am",
    "i forgot who you are",
    "i am lost",
    "help me",
    "where is my",
    "scared",
    "confused",
    "anxious"
  ];
  if (triggersOfDistress.some(trigger => lower.includes(trigger))) {
    const concern: BuddyConcernSignal = {
      concernId: `con_${Math.random().toString(36).substr(2, 9)}`,
      type: lower.includes("forgot") ? "confusion" : "emotional_distress",
      summary: `User expressed distress or memory difficulties: "${transcript}"`,
      transcript,
      urgency: "medium",
      createdAt: timestamp,
      status: "new",
    };
    memory.addConcernSignal(concern);

    // Formulate a buddy event for the queue
    const event: BuddyEvent = {
      eventId: `evt_${Math.random().toString(36).substr(2, 9)}`,
      buddyId: "buddy_carrier_v1",
      type: "concern_signal",
      category: "wellbeing",
      summary: `Distress/confusion detected: ${concern.summary}`,
      transcript,
      urgency: "medium",
      requiresAdminAction: true,
      suggestedAction: "Perform wellbeing check-in. Review recent chat history for signs of cognitive fatigue.",
      createdAt: timestamp,
      status: "queued",
    };
    memory.addEvent(event);

    actions.push({
      tool: "log_concern_signal",
      args: { type: concern.type, urgency: "medium" },
      result: `Logged wellbeing concern: "${concern.summary}"`,
      timestamp,
    });
  }

  // 6. Tell Admin / Relay message ("tell son that...")
  if (lower.startsWith("tell ") && (lower.includes(" son ") || lower.includes(" daughter ") || lower.includes(" doctor ") || lower.includes(" nurse ") || lower.includes(" admin ") || lower.includes(" family "))) {
    const relayMatch = transcript.match(/^tell\s+(admin|family|son|daughter|wife|husband|doctor|nurse)\s+(?:that\s+)?(.*)$/i);
    if (relayMatch && relayMatch[1] && relayMatch[2]) {
      const recipient = relayMatch[1].trim().toLowerCase();
      const message = relayMatch[2].trim();

      const event: BuddyEvent = {
        eventId: `evt_${Math.random().toString(36).substr(2, 9)}`,
        buddyId: "buddy_carrier_v1",
        type: "relay_message",
        category: "communication",
        summary: `Message to relay to ${recipient}: "${message}"`,
        transcript,
        urgency: "medium",
        requiresAdminAction: true,
        suggestedAction: `Relay critical user update to "${recipient}".`,
        createdAt: timestamp,
        status: "queued",
        metadata: { recipient, message }
      };
      memory.addEvent(event);

      actions.push({
        tool: "create_buddy_event",
        args: { type: "relay_message", requiresAdminAction: true },
        result: `Queued Admin Sync message to ${recipient}: "${message}"`,
        timestamp,
      });
    }
  }

  return actions;
}

/**
 * Handles explicit tools from Structured LLM Response (JSON toolActions)
 */
export function dispatchStructuredTools(toolActions: any[], memory: BuddyMemory, transcript: string): ExecutedToolAction[] {
  const actions: ExecutedToolAction[] = [];
  const timestamp = new Date().toISOString();

  if (!Array.isArray(toolActions)) return actions;

  for (const action of toolActions) {
    const { tool, args } = action;
    if (!tool || !args) continue;

    try {
      switch (tool) {
        case "remember_preference": {
          const key = (args.key || "preference").toLowerCase();
          const value = args.value || args.preference || "";
          if (value) {
            memory.getData().preferences[key] = value;
            memory.getData().knownUserPreferences[key] = value;
            memory.save();
            actions.push({
              tool,
              args,
              result: `Saved preference: "${key}" = "${value}"`,
              timestamp,
            });
          }
          break;
        }

        case "create_reminder": {
          const title = args.title || "Local Reminder";
          const dueAt = args.dueAt || "Later";
          const reminder: BuddyReminder = {
            reminderId: `rem_${Math.random().toString(36).substr(2, 9)}`,
            title,
            dueAt,
            createdAt: timestamp,
            status: "pending",
          };
          memory.addReminder(reminder);
          actions.push({
            tool,
            args,
            result: `Created reminder: "${title}" due at "${dueAt}"`,
            timestamp,
          });
          break;
        }

        case "create_note": {
          const title = args.title || "Buddy Note";
          const body = args.body || "";
          const noteType = args.type || "general";
          const note: BuddyNote = {
            noteId: `note_${Math.random().toString(36).substr(2, 9)}`,
            title,
            body,
            type: noteType,
            createdAt: timestamp,
          };
          memory.addNote(note);
          actions.push({
            tool,
            args,
            result: `Created note: "${title}" of type "${noteType}"`,
            timestamp,
          });
          break;
        }

        case "add_shopping_item":
        case "add_need_item": {
          const label = args.label || args.item || "";
          const qty = args.quantity || "1";
          if (label) {
            const newItem: BuddyListItem = {
              itemId: `item_${Math.random().toString(36).substr(2, 9)}`,
              listType: tool === "add_shopping_item" ? "shopping" : "needs",
              label,
              quantity: String(qty),
              status: "pending",
              createdAt: timestamp,
            };
            memory.addListItem(newItem);

            // Register in recurring list if needed
            if (!memory.getData().recurringNeeds.includes(label)) {
              memory.getData().recurringNeeds.push(label);
              memory.save();
            }

            actions.push({
              tool,
              args,
              result: `Added "${label}" to ${newItem.listType} list`,
              timestamp,
            });
          }
          break;
        }

        case "create_routine_step": {
          const routineType = (args.routineType || "morning").toLowerCase();
          const stepLabel = args.stepLabel || args.label || "";
          const order = Number(args.order) || 1;

          if (stepLabel) {
            const routines = memory.getData().routines;
            if (!routines[routineType]) {
              routines[routineType] = [];
            }
            routines[routineType].push({ stepLabel, order, completed: false });
            memory.save();

            actions.push({
              tool,
              args,
              result: `Added routine step: "${stepLabel}" to "${routineType}"`,
              timestamp,
            });
          }
          break;
        }

        case "log_concern_signal": {
          const concernType = args.type || "concern";
          const summary = args.summary || "Wellbeing indicator logged";
          const urgency = args.urgency || "low";
          const concern: BuddyConcernSignal = {
            concernId: `con_${Math.random().toString(36).substr(2, 9)}`,
            type: concernType,
            summary,
            transcript,
            urgency,
            createdAt: timestamp,
            status: "new",
          };
          memory.addConcernSignal(concern);
          actions.push({
            tool,
            args,
            result: `Logged concern signal: "${summary}" (${urgency} urgency)`,
            timestamp,
          });
          break;
        }

        case "create_buddy_event": {
          const category = args.category || "general";
          const summary = args.summary || "Local Event Recorded";
          const requiresAdminAction = args.requiresAdminAction !== false;
          const suggestedAction = args.suggestedAction || "Review log";
          const urgency = args.urgency || "low";
          const event: BuddyEvent = {
            eventId: `evt_${Math.random().toString(36).substr(2, 9)}`,
            buddyId: "buddy_carrier_v1",
            type: args.type || "custom",
            category,
            summary,
            transcript,
            urgency,
            requiresAdminAction,
            suggestedAction,
            createdAt: timestamp,
            status: "queued",
            metadata: args.metadata || null,
          };
          memory.addEvent(event);
          actions.push({
            tool,
            args,
            result: `Queued BuddyEvent: "${summary}"`,
            timestamp,
          });
          break;
        }

        case "summarize_conversation": {
          const summary = args.summary || "";
          const tag = args.tag || "general";
          if (summary) {
            const note: BuddyNote = {
              noteId: `note_${Math.random().toString(36).substr(2, 9)}`,
              title: `Conversation Summary [${tag.toUpperCase()}]`,
              body: summary,
              type: "summary",
              createdAt: timestamp,
            };
            memory.addNote(note);
            actions.push({
              tool,
              args,
              result: `Logged conversation summary: "${summary}"`,
              timestamp,
            });
          }
          break;
        }

        default:
          console.warn(`Unrecognized structured tool: ${tool}`);
      }
    } catch (err) {
      console.error(`Error executing tool ${tool}:`, err);
    }
  }

  return actions;
}

/**
 * Combined entry point to run both heuristic matching and LLM-driven actions safely
 */
export function executeBuddyToolActions(
  transcript: string,
  assistantMessage: string,
  memory: BuddyMemory,
  structuredToolActions?: any[]
): ExecutedToolAction[] {
  // 1. Match heuristics on User Speech
  const heuristicActions = detectUserIntents(transcript, memory);

  // 2. Process LLM-supplied structured actions
  const structuredActions = structuredToolActions 
    ? dispatchStructuredTools(structuredToolActions, memory, transcript)
    : [];

  // Combine results
  const allExecuted = [...heuristicActions, ...structuredActions];

  // Store in rolling debug log (up to 20 items)
  if (allExecuted.length > 0) {
    recentExecutedTools = [...allExecuted, ...recentExecutedTools].slice(0, 20);
  }

  return allExecuted;
}
