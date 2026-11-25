from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
W,H=1376,774
def backdrop():
    y,x=np.mgrid[0:H,0:W].astype(float)
    cx=W/2
    # seamless sweep: wall lighter at centre, floor slightly darker, soft curve between
    t=np.clip((y-H*0.50)/(H*0.30),0,1); t=t*t*(3-2*t)
    wall=np.array([247,248,250]); floor=np.array([232,236,240])
    base=wall*(1-t[...,None])+floor*t[...,None]
    r=np.sqrt(((x-cx)/(W*0.62))**2+((y-H*0.45)/(H*0.85))**2)
    vig=np.clip(r-0.55,0,1)*22
    img=np.clip(base-vig[...,None],0,255)
    return Image.fromarray(img.astype('uint8'))
BG=None
def compose(cut):
    global BG
    if BG is None: BG=backdrop()
    a=cut.getchannel('A'); bb=a.point(lambda v:255 if v>40 else 0).getbbox()
    car=cut.crop(bb); cw,ch=car.size
    s=min(W*0.80/cw,H*0.58/ch); car=car.resize((int(cw*s),int(ch*s)),Image.LANCZOS)
    cw,ch=car.size; x=(W-cw)//2; base=int(H*0.84); y=base-ch
    out=BG.copy()
    ref=car.transpose(Image.FLIP_TOP_BOTTOM)
    grad=Image.linear_gradient('L').resize((cw,ch)).point(lambda v:int(max(0,255-v*3.2)*0.13))
    out.paste(ref.filter(ImageFilter.GaussianBlur(2)),(x,base-2),ImageChops.multiply(ref.getchannel('A'),grad))
    sh=Image.new('L',(W,H),0); d=ImageDraw.Draw(sh)
    d.ellipse([x+cw*0.03,base-ch*0.06,x+cw*0.97,base+ch*0.06],fill=170)
    sh=sh.filter(ImageFilter.GaussianBlur(22))
    tight=Image.new('L',(W,H),0); d2=ImageDraw.Draw(tight)
    d2.ellipse([x+cw*0.08,base-ch*0.025,x+cw*0.92,base+ch*0.02],fill=200)
    tight=tight.filter(ImageFilter.GaussianBlur(6))
    shadow=ImageChops.lighter(sh.point(lambda v:int(v*0.55)),tight.point(lambda v:int(v*0.7)))
    out=Image.composite(Image.new('RGB',(W,H),(40,46,54)),out,shadow)
    out.paste(car,(x,y),car)
    return out
