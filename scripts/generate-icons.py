"""Generate native icons and receipt SVG from assets/chirag-mark.svg.
Requires Pillow and the system librsvg / Cairo libraries when regenerating.
"""
from pathlib import Path
import ctypes as C
import ctypes.util
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
svg = (ROOT / 'assets/chirag-mark.svg').read_text()
(ROOT / 'src/brand.ts').write_text(
    '// Generated from assets/chirag-mark.svg by scripts/generate-icons.py.\n'
    + 'export const brandSvg = ' + json.dumps(svg) + ';\n'
)
rsvg = C.CDLL(ctypes.util.find_library('rsvg-2'))
cairo = C.CDLL(ctypes.util.find_library('cairo'))
gobject = C.CDLL(ctypes.util.find_library('gobject-2.0'))
rsvg.rsvg_handle_new_from_data.argtypes = [C.c_char_p, C.c_size_t, C.c_void_p]
rsvg.rsvg_handle_new_from_data.restype = C.c_void_p
class Rectangle(C.Structure):
    _fields_ = [(name, C.c_double) for name in ('x', 'y', 'width', 'height')]
rsvg.rsvg_handle_render_document.argtypes = [C.c_void_p, C.c_void_p, C.POINTER(Rectangle), C.c_void_p]
cairo.cairo_image_surface_create.argtypes = [C.c_int, C.c_int, C.c_int]
cairo.cairo_image_surface_create.restype = C.c_void_p
cairo.cairo_create.argtypes = [C.c_void_p]
cairo.cairo_create.restype = C.c_void_p
cairo.cairo_surface_write_to_png.argtypes = [C.c_void_p, C.c_char_p]
cairo.cairo_destroy.argtypes = [C.c_void_p]
cairo.cairo_surface_destroy.argtypes = [C.c_void_p]
gobject.g_object_unref.argtypes = [C.c_void_p]
encoded = svg.encode()
handle = rsvg.rsvg_handle_new_from_data(encoded, len(encoded), None)
if not handle:
    raise RuntimeError('Invalid brand SVG')
surface = cairo.cairo_image_surface_create(0, 1024, 1024)
context = cairo.cairo_create(surface)
if not rsvg.rsvg_handle_render_document(handle, context, C.byref(Rectangle(0, 0, 1024, 1024)), None):
    raise RuntimeError('Unable to render brand SVG')
if cairo.cairo_surface_write_to_png(surface, str(ROOT / 'assets/brand-icon.png').encode()):
    raise RuntimeError('Unable to save brand icon')
cairo.cairo_destroy(context)
cairo.cairo_surface_destroy(surface)
gobject.g_object_unref(handle)
art = Image.open(ROOT / 'assets/brand-icon.png').convert('RGBA')
# Opaque white background and safe padding for native launcher masks.
image = Image.new('RGB', (1024, 1024), 'white')
art = art.resize((800, 800), Image.LANCZOS)
image.paste(art, (112, 112), art)
for density, size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    directory = ROOT / f'android/app/src/main/res/mipmap-{density}'
    for name in ('ic_launcher.png','ic_launcher_round.png'):
        image.resize((size,size), Image.LANCZOS).save(directory/name)
directory = ROOT / 'ios/ChiragEyeCare/Images.xcassets/AppIcon.appiconset'
manifest = json.loads((directory/'Contents.json').read_text())
manifest['images'] = [item for item in manifest['images'] if item['idiom'] != 'ipad']
manifest['images'] += [{'idiom':'ipad','size':f'{s}x{s}','scale':f'{scale}x'} for s, scale in [(20,1),(20,2),(29,1),(29,2),(40,1),(40,2),(76,1),(76,2),(83.5,2)]]
for item in manifest['images']:
    size = round(float(item['size'].split('x')[0])*float(item['scale'][0]))
    filename=f'icon-{size}.png'
    item['filename']=filename
    image.resize((size,size), Image.LANCZOS).save(directory/filename)
(directory/'Contents.json').write_text(json.dumps(manifest,indent=2)+'\n')
