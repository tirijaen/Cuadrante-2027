import json

with open("cuadrante_2027_v2.json") as f:
    data = json.load(f)

# Count distribution of night blocks
total_3n = 0
total_2n = 0
total_4n = 0
for w_i, w_name in enumerate(data["workers"]):
    m = data["matrix"][w_i]
    cur_b = 0
    blocks = []
    for s in m:
        if s == "N": cur_b += 1
        else:
            if cur_b > 0: blocks.append(cur_b); cur_b = 0
    if cur_b > 0: blocks.append(cur_b)
    print(f"{w_name:12s}: {blocks}")
    total_3n += blocks.count(3)
    total_2n += blocks.count(2)
    total_4n += blocks.count(4)

print(f"Total 3-night blocks: {total_3n}")
print(f"Total 2-night blocks: {total_2n}")
print(f"Total 4-night blocks: {total_4n}")
