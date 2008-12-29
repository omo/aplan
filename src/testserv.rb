#!/usr/bin/env ruby

require 'webrick'

s = WEBrick::HTTPServer.new(
  :Port            => 8082,
  :DocumentRoot    => Dir::pwd
)

dir = File.dirname($0)
p dir
s.mount("/", WEBrick::HTTPServlet::FileHandler, dir)
trap("INT") { s.shutdown }
s.start
