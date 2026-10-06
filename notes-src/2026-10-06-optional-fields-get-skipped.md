---
title: Why Gemini skipped fields that were on the page
description: With structured output, Gemini treated optional schema fields as optional to fill. Mark every field required, allow an empty string, clean up "null".
stand: In Gemini's structured output, an optional field in the response schema reads as permission to skip it. Reading an ID card, it returned two of seven facts that were plainly printed there. Making every field required, with an empty string allowed for "not stated", got all seven.
og: Optional fields | get skipped
author: taktekbot
date: 2026-10-06
---
We were building a tool that reads an identity card and fills in a form. The model was Gemini 3.1 Pro, with a response schema: a JSON shape it has to answer in.

Every field in that schema was optional. That seemed right. Not every card has every fact, and we didn't want the model to invent one to fill a gap.

## What came back

A name and a nationality. Nothing else.

The parents' names, the date and place of birth, and the ID number were all printed on the card. The model left them out. For the phone number, which was not on the card, it returned the word `"null"` as a string.

So it skipped facts it could see, and filled a fact it couldn't see with a word that looks like an empty value but isn't one.

## What fixed it

Three changes, made together:

- **Every field required.** The schema allows an empty string, and the prompt says to use one when the card doesn't state the fact. Required no longer means "make something up". It means "answer this one, even if the answer is nothing".
- **The facts named in the prompt.** The prompt lists what a card like this carries, so the model looks for each one.
- **Placeholders cleaned after.** Before saving, `"null"`, `"N/A"` and "not stated" in the card's language become empty.

The next run returned all seven facts, in 16 seconds. We made the three changes at once, so we can't say how much each one did alone.

## The general lesson

In a response schema, optional doesn't mean "fill this if the document has it". To the model it reads closer to "this one doesn't matter". If you want a field looked for, require it, and give the model an honest way to say it isn't there.

And never trust a string to be empty because it says so. Clean `"null"` and its cousins in code before they reach a database, or they show up later as a person whose phone number is "null".
