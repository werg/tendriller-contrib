# Historical chronological application evidence

The current application contract is [one public peer session](application-primitives.md)
with ordinary applied outcomes, retained coverage and explicit recovery. Native,
browser and hosted roles use different transport policies and declared
capabilities within that contract. There is no maintained resident/finalized
application API alongside it.

The [earlier guide at its exact source snapshot](https://github.com/werg/tendriller-contrib/blob/11c445e4d25e7b8ca415f3327c8049fcadc9f547/guides/finalized-peer-applications.md)
records the former chronological implementation and its immutable-final-prefix
assumptions. The [historical recipe archive](../cookbooks/run-a-peer-application/notes/finalized-resident-recipe.md)
links its source and evidence. Those reports remain facts about their recorded
revisions; they neither qualify the common session nor require preservation of
obsolete APIs or storage migration code.

Use the [current public-artifact gates](../cookbooks/run-a-peer-application/checks/README.md)
for implementation and qualification work. A stronger guarantee must be an
explicitly supported capability of that same session and have its own evidence.
