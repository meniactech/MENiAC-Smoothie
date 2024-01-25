# -------------------------------------------------------------------------------- #
#
#   Smoothie.py
#
#   Helper Script to collect information about the scene when used Blender with -b parameter.
#   This script can be called from prompt: blender.exe -b --python <path>\smoothie.py
#
#   (c)2024 - Meniac Oy
#
# -------------------------------------------------------------------------------- #

import bpy # Blender Specific Python API

S = bpy.context.scene
split_marker = "§§§§§"  # Can be used as Split parameter

# Print Macro
def p(s,v,l=False):
    if l: last_character = ''
    else: last_character = ','
    print( '\t"' + s + '" : "' + str(v) + '"' + last_character )

# -------------------------------------------- #

print ( split_marker + "{" )

p( "anim_start", S.frame_start )                    # Start Frame
p( "anim_end", S.frame_end )                        # End Frame
p( "resolution_x", S.render.resolution_x )          # Resolution X
p( "resolution_y", S.render.resolution_y, True )    # Resolution Y

# ... Add params as needed.

print ( "}" + split_marker )

# -------------------------------------------- #
