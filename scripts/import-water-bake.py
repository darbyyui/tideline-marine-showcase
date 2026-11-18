"""Import the JSON exported by the isolated local baking page."""
from pathlib import Path
import json,gzip,sys,math
root=Path(__file__).resolve().parents[1]
revisions=json.loads((root/'water-data/revisions.json').read_text())
data=json.loads(Path(sys.argv[1]).read_text())
for kind,entry in revisions.items():
 value=data[kind]
 assert value['schema']==1 and value['revision']==entry['revision'],kind+' needs a fresh bake'
 for key,length in [('profile',128),('volume',49152),('bounds',4)]:
  assert len(value[key])==length and all(math.isfinite(n) for n in value[key]),kind+' invalid '+key
 assert len(value['opening'])<=96 and all(len(p)==3 and all(math.isfinite(n) for n in p) for p in value['opening'])
 payload=json.dumps(value,separators=(',',':')).encode()
 target=root/entry['path'][2:]
 target.write_bytes(gzip.compress(payload,compresslevel=9,mtime=0))
 print(kind,':',len(payload),'JSON bytes ->',target.stat().st_size,'gzip bytes')
