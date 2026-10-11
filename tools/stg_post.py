import numpy as np
from PIL import Image
from rembg import remove, new_session
S=new_session('isnet-anime');O='/workspace/sakurayo-v46-handoff/android-app/app/src/main/assets/game/art/shmup/'
for c in ["sayo","aya","rion","boss1","boss2","boss3"]:
  ims={k:remove(Image.open(f'stg2/{c}_{k}.png').convert('RGB'),session=S) for k in ["idle0","idle1","left","right"]}
  bb=[im.getchannel('A').point(lambda v:255 if v>40 else 0).getbbox() for im in ims.values()]
  box=(min(b[0] for b in bb),min(b[1] for b in bb),max(b[2] for b in bb),max(b[3] for b in bb))
  for k,im in ims.items():
    cr=im.crop(box);H=192;cr=cr.resize((round(cr.width*H/cr.height),H),Image.LANCZOS);cr.save(O+f'chibi_{c}_{k}.webp',quality=90)
  cut=remove(Image.open(f'stg2/{c}_cutin.png').convert('RGB'),session=S);cut=cut.crop(cut.getchannel('A').getbbox());H=720;cut.resize((round(cut.width*H/cut.height),H),Image.LANCZOS).save(O+f'cut_{c}.webp',quality=88)
  print(c,box)
