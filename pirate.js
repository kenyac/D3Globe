var  toRadians = Math.PI / 180;
var  toDegrees = 180 / Math.PI;

function crossProduct(v0, v1){
  return[v0[1]*v1[2] - v0[2]*v1[1], v0[2]*v1[0] - v0[0]*v1[2], v0[0]*v1[1] - v0[1]*v1[0]];
}

function dotProduct(v0, v1){
  for(var i = 0, product = 0; i < v0.length; i++){
    product += v0[i]*v1[i];
  }
  return product;
}

//coords is longitute and latitude represented in an array of size 2
function LL_to_Cartesian(coord){

  var lon = coord[0] * toRadians;
	var lat = coord[1] * toRadians;
  
	var x = Math.cos(lat) * Math.cos(lon);
	var y = Math.cos(lat) * Math.sin(lon);
	var z = Math.sin(lat);
  
	return [x, y, z];  
}

function quarternion(v0, v1){
  if(!v0 || !v1) return;
  
  var v_cross = crossProduct(v0,v1),
    v_len = Math.sqrt(dotProduct(v0,v1));
  if(!v_len) return;
  
  var theta = .5 * Math.acos(Math.max(-1, Math.min(1, dotProduct(v0, v1))));
  
  qi  = v_cross[2] * Math.sin(theta) / v_len; 
	qj  = - v_cross[1] * Math.sin(theta) / v_len; 
	qk  = v_cross[0]* Math.sin(theta) / v_len;
	qr  = Math.cos(theta);
  
  return theta && [qr, qi, qj, qk];
}

//euler is a 3d euler vector
function eulerToQuarternion(euler){
	if(!euler) return;
	var roll = .5 * euler[0] * toRadians,
        	pitch = .5 * euler[1] * toRadians,
        	yaw = .5 * euler[2] * toRadians,

        sr = Math.sin(roll),
        cr = Math.cos(roll),
        sp = Math.sin(pitch),
        cp = Math.cos(pitch),
        sy = Math.sin(yaw),
        cy = Math.cos(yaw),

        qi = sr*cp*cy - cr*sp*sy,
        qj = cr*sp*cy + sr*cp*sy,
        qk = cr*cp*sy - sr*sp*cy,
        qr = cr*cp*cy + sr*sp*sy;

    	return [qr, qi, qj, qk];
}
function quarternionProduct(q1, q2){
	if(!q1 || !q2) return;

    var a = q1[0],
        b = q1[1],
        c = q1[2],
        d = q1[3],
        e = q2[0],
        f = q2[1],
        g = q2[2],
        h = q2[3];

    return [
     a*e - b*f - c*g - d*h,
     b*e + a*f + c*h - d*g,
     a*g - b*h + c*e + d*f,
     a*h + b*g - c*f + d*e];
}

function quarternionToEuler(q){
	if(!q) return;

	return [ Math.atan2(2 * (q[0] * q[1] + q[2] * q[3]), 1 - 2 * (q[1] * q[1] + q[2] * q[2])) * toDegrees, 
			 Math.asin(Math.max(-1, Math.min(1, 2 * (q[0] * q[2] - q[3] * q[1])))) * toDegrees, 
			 Math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] * q[2] + q[3] * q[3])) * toDegrees];
}

function convertToEuler(v0,v1,theta){
	var q = quarternionProduct(eulerToQuarternion(theta), quarternion(LL_to_Cartesian(v0), LL_to_Cartesian(v1)));
  return quarternionToEuler(q);
}

//500, 960

var height = 750,
    width = 800;

var projection = d3.geoOrthographic()
    .scale(350)
    .translate([width / 2, height / 2])
    .clipAngle(90);

var path = d3.geoPath()
    .projection(projection);


const config = {
  center: [139.69, 35.69],
  radius: 2.5
}

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

var drag = d3.drag()
			.on("start", dragstarted)
			.on("drag", dragged)
			.on("end", dragended);

svg.call(drag);
var geoCircle = d3.geoCircle();
 var circle = [];

d3.json("world.json", function(error, world){
  if (error) throw error;

  svg.append("path")
      .datum(topojson.feature(world, world.objects.land))    
	.style("pointer-events", "visible")
      .attr("class", "base land")
      .attr("d", path);

  borders = topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; });

  svg.append("path")   
  		.datum(borders)
  		.attr("class", "base border")
  		.attr("d", path);

 	circle = svg.append("path")  
      	.datum({endAngle: 1.5})
 		.style("pointer-events", "visible") 
 		.on("mousedown", function() { d3.event.stopPropagation(); })
		.on("click", clicked)
      	.attr("class", "circle")
 		.attr("id", "")
      	.attr("d", d => path(geoCircle.center(config.center).radius(d.endAngle)())); 
  
  
 
});

var gpos0, o0;


function dragstarted(){

	gpos0 = projection.invert(d3.mouse(this));
  //console.log(d3.mouse(this));
	o0 = projection.rotate();

	svg.insert("path")
             .datum({type: "Point", coordinates: gpos0})
             .attr("class", "point")
             .attr("d", path); 
  
}

function dragged(){

	var gpos1 = projection.invert(d3.mouse(this));

	o0 = projection.rotate();

	var o1 = convertToEuler(gpos0, gpos1, o0);
	projection.rotate(o1);

	
  svg.selectAll(".point")
	 		.datum({type: "Point", coordinates: gpos1})
			.attr("d",path);
  svg.selectAll(".land").attr("d", path);
  svg.selectAll(".border").attr("d", path);
  svg.selectAll(".circle").attr("d", d => path(geoCircle.center(config.center).radius(d.endAngle)()));

}

function dragended(){
	svg.selectAll(".point").remove();
    
  

}

 function clicked(){
    if (d3.event.defaultPrevented) return;
      console.log("Tokyo");    
      
    var p = projection.invert(d3.mouse(this));
    var currentRotate = projection.rotate();
    projection.rotate([-p[0], -p[1]]);
  	path.projection(projection);   
    var nextRotate = projection.rotate();
   
          
    
    d3.selectAll(".base")
   .transition()
   .attrTween("d", function(d) {
      var r = d3.interpolate(currentRotate, nextRotate);
        return function(t) {
          projection
            .rotate(r(t));
          path.projection(projection);
          svg.selectAll(".circle").attr("d", d => path(geoCircle.center(config.center).radius(d.endAngle)()));
          return path(d);
        }       
   })
   .duration(1000);
   
   
   
   
     
  }
 


