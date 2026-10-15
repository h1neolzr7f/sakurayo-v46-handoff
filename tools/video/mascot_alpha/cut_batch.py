import sys,os,glob,subprocess,numpy as np,cv2
from rembg import new_session, remove
from PIL import Image
ART='/workspace/sakurayo-v46-handoff/android-app/app/src/main/assets/game/art/live_video'
OUT='/workspace/mascot_cut/out';os.makedirs(OUT,exist_ok=True)
s=new_session('isnet-anime')
jobs=[(c,os.path.basename(f)[:-4]) for c in ['sayo','aya','rion'] for f in sorted(glob.glob(f'{ART}/{c}/*.mp4'))]
for c,clip in jobs:
  dst=f'{OUT}/{c}_{clip}.mp4'
  if os.path.exists(dst):continue
  cap=cv2.VideoCapture(f'{ART}/{c}/{clip}.mp4');fr=[]
  while True:
    ok,f=cap.read()
    if not ok:break
    fr.append(f)
  ms=[]
  for f in fr:
    a=np.array(remove(Image.fromarray(cv2.cvtColor(f,cv2.COLOR_BGR2RGB)),session=s,only_mask=True))
    ms.append(a)
  n=len(ms)
  # circular temporal smoothing -> no flicker, loop closes
  S=(ms[i-1].astype(np.float32)*.25+ms[i].astype(np.float32)*.5+ms[(i+1)%n].astype(np.float32)*.25 for i in range(n))
  td=f'/tmp/mc_{c}_{clip}';os.makedirs(td,exist_ok=True)
  for i,(f,a) in enumerate(zip(fr,S)):
    a=a/255
    b=(a>.5).astype(np.uint8);k,lab,st,_=cv2.connectedComponentsWithStats(b,8)
    if k>1:
      keep=np.zeros_like(b)
      big=st[1:,cv2.CC_STAT_AREA].max()
      for j in range(1,k):
        if st[j,cv2.CC_STAT_AREA]>big*.04:keep|=(lab==j)
      a=a*cv2.dilate(keep,np.ones((9,9),np.uint8)).astype(np.float32)
    a=np.clip((a-.08)/.84,0,1);a=cv2.GaussianBlur(a,(3,3),0)
    m8=(a*255).astype(np.uint8)
    cv2.imwrite(f'{td}/{i:04d}.png',np.hstack([f,cv2.cvtColor(m8,cv2.COLOR_GRAY2BGR)]))
  subprocess.run(['ffmpeg','-v','error','-y','-framerate','30','-i',f'{td}/%04d.png','-c:v','libx264','-profile:v','high','-pix_fmt','yuv420p','-crf','21','-preset','slow','-movflags','+faststart',dst],check=True)
  subprocess.run(['rm','-rf',td]);print('done',c,clip,n,flush=True)
