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

# Task estimation feature

Feature goal: to speed up and simplify the process of preliminary task estimation before a cycle begins. Feature helps understand the scope of new tasks faster by relying on similar historical cases and mapping them to a shared effort scale.

Product value: this feature turns task estimation from a fully manual process into an assisted workflow. Instead of spending hours discussing each task during planning meetings, the team gets a preliminary estimate grounded in historical analogies. This speeds up cycle planning, reduces the cost of synchronous discussions, and over time can significantly shorten - or nearly eliminate - two-hour backlog estimation meetings.

Flow: first, it checks whether the task is sufficiently well-defined -> then searches for similar real-world examples -> asks the model to select an estimate only from a fixed scale -> returns not only a number, but also confidence and evidence.

Edge cases: the quality of the result depends directly on the quality and coverage of historical data. If there are too few similar completed tasks in history, or the retrieved matches are weak, the system returns a low-confidence estimate or asks for clarification. Another important edge case is vague tasks: if the title and description do not make it clear what exactly should be changed and what the expected outcome is, the feature should not pretend to be confident and should return a needs clarification state instead of an estimate. There are also boundary cases where a task appears similar to several historical examples at once; in those situations, the result may be less stable and should still be reviewed by an engineer. The vector DB index is intended to be refreshed at the end of a cycle, when tasks have clearer descriptions - which may evolve during implementation, for example when new acceptance criteria or test cases are added - and final estimates, since the actual effort may end up being higher or lower than initially expected.

Current estimation algorithm: the estimation flow works as a retrieval-based workflow. First, the system takes the current task draft values - title, description, and type if present - and checks whether there is enough context to estimate the task. If the task is too vague, it returns a needs clarification state with a short reason and follow-up questions instead of an estimate. If the context is sufficient, the system builds a unified embedding input from the current task, generates a vector using an embedding model, and queries Pinecone to retrieve the most similar completed historical tasks with existing estimates. Then the LLM receives two sources of grounding: the fixed estimation scale 0, 1, 2, 3, 5, 8 together with the rule (TASK_ESTIMATION_RULES links the estimate value to business context) for each value, and the top similar tasks returned by retrieval. The model must choose exactly one value from that scale and return estimate, confidence, a short reason, and a list of similarTasksUsed. In the UI, the result is shown inside the AI Estimation panel; if the user later changes the title or description, the previous estimate is marked as stale, and the action becomes available again as Regenerate estimate.

A vector database is used to improve retrieval quality by finding semantically similar historical tasks, even when they are described with different wording. Compared to plain keyword or field-based lookup, this makes the estimate more grounded in actual past work. As more completed tasks with finalized estimates are added to the historical pool, retrieval coverage and confidence can improve over time