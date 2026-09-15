# Scoring

Model 1.0.0 applies severity weights info 0, low 2, medium 6, high 15, critical 30, then confidence H=1/M=.5/L=0. It takes the maximum per deterministic risk key, caps category deductions, and computes `max(0, 100 - ceil(sum(category deductions)))`. Inactive and low-confidence findings deduct zero. No analyzed supported input yields a null score; partial scores are provisional.

Caps are secrets 30, shell 30, filesystem 25, network 15, MCP 10, agent-config 25, supply-chain 40, unicode 10, permissions 25, and prompt-security 35. Adding a finding cannot improve the score: it can only preserve or increase a group maximum and capped category sum. A score is observed configuration risk, not a protection guarantee.

A group key includes category, rule family, principal/source and fixed semantic fact;
thus duplicated mentions for one principal collapse, while distinct principals do
not. Compounds are separately capped `agent-config` groups and retain their exact
constituent findings. Worked model-1.0.0 examples are: clean = 100; two low/H groups
= 96; medium/H plus low/H = 92; two high/H groups in distinct categories = 70;
critical supply-chain plus high secrets and filesystem = 40; and that profile plus
high permissions and compound = 10. Seeded tests cover both adding a new group and
strengthening an existing group: neither operation can increase the score.
