/*
	Can happen concurrently since touchevents are separate from normal key n mouse input.
 */
var touchesPressed = [];
var ingame;

function handleTouchStart(event)
{
	if(ingame)
	{
		event.preventDefault();
	}
	
	var touches = event.changedTouches;
	
	// why the hell is it a "touchlist" and not an array???
	for(var index = 0; index < touches.length; index++)
	{
		touchesPressed.push(copyTouch(touches[index]));
	}
}

function handleTouchEnd(event)
{
	if(ingame)
	{
		event.preventDefault();
	}
	var touches = event.changedTouches;
	
	
	for(var index = 0; index < touches.length; index++)
	{
		var idIndex = getTouchIndexById(touches[index].identifier);
		
		if(idIndex >= 0)
		{
			handle_touchEnd(touches[index]);
			touchesPressed.splice(idIndex,1);
		}
	}
}

function handleTouchCancel(event)
{
	if(ingame)
	{
		event.preventDefault();
	}
	var touches = event.changedTouches;
	
	for(var index = 0; index < touches.length; index++)
	{
		var idIndex = getTouchIndexById(touches[index].identifier);
		
		if(idIndex >= 0)
		{
			touchesPressed.splice(idIndex,1);
		}
	}
}

function handleTouchMove(event)
{
	if(ingame)
	{
		event.preventDefault();
	}
	
	var touches = event.changedTouches;
	
	for(var index = 0; index < touches.length; index++)
	{
		var idIndex = getTouchIndexById(touches[index].identifier);
		
		if(idIndex >= 0)
		{
			touchesPressed[index].currentX = touches[index].clientX;
			touchesPressed[index].currentY = touches[index].clientY;
			/*touchesPressed.splice(idIndex,1, copyTouch(touches[index]));*/
		}
	}
}

function copyTouch(touch) {
  return { identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY };
}

function getTouchIndexById(id)
{
	for (var index = 0; index < touchesPressed.length; index++) 
	{		
		if (touchesPressed[index].identifier == id) 
		{
			return index;
		}
	}
	return -1;
}