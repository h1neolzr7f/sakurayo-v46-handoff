# 待机 8 帧逐帧归一化：每帧按自身 bbox 裁切、统一高度、底部居中，消除生成时的尺度漂移（防闪烁）；再测相邻帧差，离群帧用相邻帧替代
import numpy as np
from PIL import Image
from rembg import remove, new_session
S=new_session('isnet-anime');O='/workspace/sakurayo-v46-handoff/android-app/app/src/main/assets/game/art/shmup/'
for c in ["sayo","aya","rion","boss1","boss2","boss3"]:
  fr=[]
  for i in range(8):
    im=remove(Image.open(f'stg2/{c}_idle{i}.png').convert('RGB'),session=S); b=im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox(); fr.append(im.crop(b))
  H=192; W=max(round(f.width*H/f.height) for f in fr)
  out=[]
  for f in fr:
    w=round(f.width*H/f.height); cv=Image.new('RGBA',(W,H)); cv.alpha_composite(f.resize((w,H),Image.LANCZOS),((W-w)//2,0)); out.append(cv)
  A=[np.asarray(o).astype(float) for o in out]; d=[np.abs(A[i]-A[(i+1)%8]).mean() for i in range(8)]; med=np.median(d)
  bad=[i for i in range(1,8) if d[i-1]>1.8*med and d[i]>1.8*med]
  for i in bad: out[i]=out[i-1]
  for i,o in enumerate(out): o.save(O+f'chibi_{c}_idle{i}.webp',quality=90)
  print(c,'diffs',[round(x,1) for x in d],'replaced',bad)
