stops = open('all_sample_stops.txt').read().splitlines()
filtered_stops = list(set(stops))

for stop in filtered_stops:
	print stop