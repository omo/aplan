window.onload = (function(){try{

test("a basic test example", function()
{
	ok( true, "this test is fine" );
	var value = "hello";
	equals( "hello", value, "We expect value to be hello" );
});

module("aplan");

test("parse slice from summary text", function()
{
	var slice = APlan.parse_slice("((3;4;))");
	equals(slice.estimation(), 3);
	equals(slice.actual(), 4);
});

test("parse slice should allow empty act", function()
{
	var slice = APlan.parse_slice("((3;;))");
	equals(slice.actual(), 0);
});

test("parse slice reject non-sliced summary", function()
{
	var slice = APlan.parse_slice("Hello");
	ok(null == slice, 2);
});

test("update_estimation should push new element", function()
{
	var slice = APlan.parse_slice("((3;4;))");
	slice.update_estimation(5);
	equals(slice.estimation(), 5);
});

test("update_acutual should replace value", function()
{
	var slice = APlan.parse_slice("((3;4;))");
	slice.update_actual(5);
	equals(slice.actual(), 5);
});

test("toString should recover original", function()
{
	var expected = "((3;5;))";
	var slice = APlan.parse_slice(expected);
	equals(slice.toString(), expected);
});

} catch(e){}});