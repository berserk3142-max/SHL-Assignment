"""Build catalog by scraping SHL catalog pages."""
import requests, json, time, os
from bs4 import BeautifulSoup

BASE = "https://www.shl.com"
HDR = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
TM = {"A":"Ability & Aptitude","B":"Biodata & Situational Judgment","C":"Competency",
      "D":"Development & 360","E":"Assessment Exercises","K":"Knowledge & Skills",
      "P":"Personality & Behavior","S":"Simulations"}

def scrape_page(start):
    url = f"{BASE}/solutions/products/product-catalog/?start={start}&type=1"
    r = requests.get(url, headers=HDR, timeout=30)
    soup = BeautifulSoup(r.text, "html.parser")
    items = []
    
    # Try finding table rows
    for row in soup.select("tr"):
        cells = row.find_all("td")
        if len(cells) < 4: continue
        link = cells[0].find("a")
        if not link: continue
        
        name = link.get_text(strip=True)
        href = link.get("href","")
        if href.startswith("/"): href = BASE + href
        
        # Check circles for yes/no
        remote = bool(cells[1].select_one(".catalogue__circle--yes, [class*=yes]"))
        adaptive = bool(cells[2].select_one(".catalogue__circle--yes, [class*=yes]"))
        
        types = []
        for s in cells[3].find_all("span"):
            t = s.get_text(strip=True)
            if t in TM: types.append(t)
        
        items.append({"name":name,"url":href,"remote_testing":remote,
                      "adaptive_irt":adaptive,"test_type":types,
                      "test_type_labels":[TM.get(t,t) for t in types],"description":""})
    return items

all_items = []
for s in range(0, 384, 12):
    print(f"Page start={s}...", end=" ", flush=True)
    try:
        items = scrape_page(s)
        if not items: 
            print("empty, stopping")
            break
        all_items.extend(items)
        print(f"got {len(items)} (total {len(all_items)})")
    except Exception as e:
        print(f"error: {e}")
    time.sleep(1.5)

print(f"\nTotal: {len(all_items)}")
out = os.path.join(os.path.dirname(__file__), "data", "catalog.json")
os.makedirs(os.path.dirname(out), exist_ok=True)
json.dump(all_items, open(out,"w",encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"Saved to {out}")
