extends SceneTree
var output = "C:/Users/mjabr/Projects/Mark_Portfolio/frontend/src/gifs/"
func _initialize():
    root.hide()
    call_deferred("capture")
func settle():
    for i in 8:
        await process_frame
    await RenderingServer.frame_post_draw
func capture():
    var viewport = SubViewport.new()
    viewport.size = Vector2i(1600, 828)
    viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
    viewport.own_world_3d = true
    root.add_child(viewport)
    var viewer = load("res://scenes/tools/tree_viewer.tscn").instantiate()
    viewport.add_child(viewer)
    viewer.set("ShowPuffs", true)
    viewer.set("ShowCrown", true)
    viewer.set("ShowLeafShape", true)
    viewer.set("CanopyLightFollowsCrown", true)
    for type in [0,1,2]:
        viewer.set("Type",type)
        for variant in range(3):
            viewer.set("Variant",variant)
            await settle()
            viewer.call("FrameTree")
            var camera = viewer.get_node("Camera")
            camera.size *= 1.35
            camera.position += camera.basis.x * camera.size * 0.16
            viewer.call("PlaceCanopyLight")
            await settle()
            var label = ["young", "mature", "aged"][type]
            var file = output + "tree-viewer-" + label + "-" + str(variant) + ".png"
            var result = viewport.get_texture().get_image().save_png(file)
            print("CAPTURE ", file, " ", result)
            viewer.set("ShowPuffs",false)
            viewer.set("ShowCrown",false)
            viewer.set("ShowLeafShape",false)
            await settle()
            viewport.get_texture().get_image().save_png(output + "tree-viewer-" + label + "-" + str(variant) + "-clean.png")
            viewer.set("ShowPuffs",true)
            viewer.set("ShowCrown",true)
            viewer.set("ShowLeafShape",true)
    quit()

