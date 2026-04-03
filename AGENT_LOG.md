### Limitations:
- there was not enough time to test everything thoroughly, so bugs are possible
- there are no tests
- local database
- there are no agent rules in the repository because they are configured locally on my machine
- there is no more precise GPT client configuration yet, such as token limits, temperature, and so on
- the top 7 tasks are selected after filtering by the baseline score. To improve this, the algorithm should consider several criteria at once: baseline priority, recently created high-priority tasks, semantic urgency or blocker signals in the title/description, as well as customer-impact and release-impact markers

### Seed DB

There is a script in the repository for seeding the database. Each task has its own volume of data, which helps create a more accurate impression of how the features work and makes testing more realistic. The idea is to run the seed for the task you want to test, test it, clear the database, and then seed it again for a different task.

### Task Prioritization Algorithm

The goal here is to define initial rules that filter out most irrelevant tasks. The available set of fields is quite limited, so the mechanism for building the initial score is somewhat blurry. More weight is given to AI summarization of the title and description. Accordingly, a more capable model will produce better results. To balance cost and speed, `gpt-5.4-mini` was chosen here.

The algorithm first selects only unfinished tasks, then calculates a baseline priority score for each one based on three signals: the `priority` level, the current `status`, and the task age derived from `createdAt`. After that, tasks are ranked by this baseline score, and the LLM only adds a semantic evaluation on top of that ranking by analyzing the title and description to determine whether there are signs of urgency, a blocker, a bug, high product importance, or, on the contrary, vagueness and low actionable value. In the end, one task is selected as the one that appears most important and most appropriate right now. Completed tasks are never considered, and if the AI evaluation is unavailable or invalid, the system deterministically picks the task with the highest baseline score.

There may also be cases where several tasks are important. One task may implicitly block another one, for example, if migrations are broken, we cannot fix a user login bug. That type of dependency is usually more obvious to developers than to AI, which is why several urgent tasks may still be shown. Related tasks can also appear for the same reason.

Also, if the description contains words like `URGENT`, `BLOCKER`, `CRITICAL`, `ASAP`, `revenue impact`, and so on, the agent may start to overvalue them. Because of that, the model should evaluate not the tone of the text, but the justification behind it: impact, what is broken, business effect, and deadline.

# Decomposition Algorithm

It is important here to define clear criteria for when a task can be broken down and when a task is too unclear, for example because the current behavior, expected behavior, what exactly is broken, or the scope are not described.

As for the functions being used, this part relies on tool calling.

The decomposition algorithm works like this: in the `Edit Task` modal, the user edits the title and description and clicks `Generate subtasks`, after which the frontend sends the current form draft to the backend rather than the old data from the database. The backend launches an AI agent through the OpenAI Responses API with function calling, where the first required step is for the model to call `assess_task_decomposition` and classify the task as `needs_clarification` if there is not enough context, `cannot_decompose` if the task is already small and atomic, or `ready` if it is clear and contains several meaningful engineering steps. Only in the `ready` case does the agent call `generate_subtasks` and return a structured subtask list. The backend validates all inputs and AI outputs with Zod and returns only a preview to the frontend without saving anything to the database. Persistence happens through a separate action only if the user explicitly clicks `Create subtasks`.

# Agents

AI was used as an accelerator for UI implementation, creating test tasks for the seed scripts, and reviewing code and decisions in the form of text prompts.

The UI itself was built step by step, with testing after each step to make sure everything worked. For example, whether a task can be created, whether a task can be updated, and so on. After completing some stage, I used AI for review and then applied fixes based on that review. I was already familiar with tool calling, but task prioritization was not immediately clear to me. For prioritization, AI helped me quickly assemble the first working pipeline: after clicking a button, all tasks are fetched from the database. Later I improved the existing template, and that is when I got a clearer idea of how to approach it and what role AI should play.
