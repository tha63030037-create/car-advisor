from PIL import Image, ImageDraw, ImageFilter, ImageChops
import numpy as np
W,H=1376,774
def backdrop():
    y,x=np.mgrid[0:H,0:W]
    cx,cy=W/2,H*0.42
    r=np.sqrt(((x-cx)/(W*0.75))**2+((y-cy)/(H*0.9))**2)
    wall=np.clip(1-r,0,1)**1.6
    base=np.zeros((H,W,3))
    top=np.array([16,18,22]); glow=np.array([70,76,86])
    base=top+(glow-top)*wall[...,None]
    # floor: slightly darker band with soft horizon
    hz=int(H*0.64)
    f=np.clip((y-hz)/(H-hz),0,1)
    floor=np.array([10,11,13])+np.array([34,37,42])*(1-f)[...,None]*np.clip(1-np.abs(x-cx)/(W*0.7),0,1)[...,None]
    mask=(y>=hz)[...,None]
    img=np.where(mask,floor,base)
    im=Image.fromarray(img.astype('uint8'))
    # horizon soften
    im=im.filter(ImageFilter.GaussianBlur(2))
    # ceiling light strips
    L=Image.new('L',(W,H),0); d=ImageDraw.Draw(L)
    for i,(a,b) in enumerate([(0.18,0.40),(0.60,0.82)]):
        d.rounded_rectangle([int(W*a),int(H*0.035)+i*0,int(W*b),int(H*0.035)+6],3,fill=235)
    glowL=L.filter(ImageFilter.GaussianBlur(14))
    im=Image.composite(Image.new('RGB',(W,H),(225,232,245)),im,ImageChops.lighter(L,glowL.point(lambda v:int(v*0.7))))
    return im
BG=None
def compose(cut):
    global BG
    if BG is None: BG=backdrop()
    a=cut.getchannel('A'); bb=a.point(lambda v:255 if v>40 else 0).getbbox()
    car=cut.crop(bb)
    cw,ch=car.size
    s=min(W*0.80/cw, H*0.56/ch); car=car.resize((int(cw*s),int(ch*s)),Image.LANCZOS)
    cw,ch=car.size; x=(W-cw)//2; base=int(H*0.83); y=base-ch
    out=BG.copy()
    # reflection
    ref=car.transpose(Image.FLIP_TOP_BOTTOM)
    grad=Image.linear_gradient('L').resize((cw,ch)).point(lambda v:int(max(0,255-v*2.2)*0.28))
    ra=ImageChops.multiply(ref.getchannel('A'),grad)
    ref=ref.filter(ImageFilter.GaussianBlur(1.5)); out.paste(ref,(x,base-2),ra)
    # contact shadow
    sh=Image.new('L',(W,H),0); d=ImageDraw.Draw(sh)
    d.ellipse([x+cw*0.04,base-ch*0.07,x+cw*0.96,base+ch*0.05],fill=210)
    sh=sh.filter(ImageFilter.GaussianBlur(18))
    out=Image.composite(Image.new('RGB',(W,H),(0,0,0)),out,sh.point(lambda v:int(v*0.85)))
    out.paste(car,(x,y),car)
    return out

def clean(cut):
    from scipy import ndimage
    a=np.array(cut.getchannel('A'))
    m=a>60
    lab,n=ndimage.label(m)
    if n>1:
        sizes=ndimage.sum(m,lab,range(1,n+1)); keep=1+int(np.argmax(sizes))
        a=np.where(lab==keep,a,0).astype('uint8')
    h,w=a.shape
    edge={'L':(a[:,:max(2,w//100)]>60).mean(),'R':(a[:,-max(2,w//100):]>60).mean(),'B':(a[-max(2,h//100):,:]>60).mean()}
    out=cut.copy(); out.putalpha(Image.fromarray(a))
    return out,edge
