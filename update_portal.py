import sys

with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "showPortal ? (" in line:
        start_idx = i
        break

for i in range(start_idx + 1, len(lines)):
    if "        ) : (" in lines[i] and "HomePage" in lines[i+1]:
        end_idx = i
        break

print(f"Start: {start_idx}, End: {end_idx}")
