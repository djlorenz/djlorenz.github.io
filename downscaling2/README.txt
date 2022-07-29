All the data is in the new netCDF-4/HDF5 format which allows data compression. If you only have netcdf-3 or the basic netcdf-4 without HDF then you won't be able to read the files. Instead, get the lastest version of your software.

A list of software that can read netcdf can be found here:
http://www.unidata.ucar.edu/software/netcdf/software.html

----------------------------------------------------------------------
The format of the directories is as follows:

scenario/climate_model/ensemble_member

where "scenario" is either: historical rcp26 rcp45 rcp60 rcp85
and "climate_model" is one of 24 climate models that submitted enough daily data for the downscaling. More information on the CMIP5 is here: 
https://pcmdi.llnl.gov/mips/cmip5/
"ensemble_member" is r1i1p1 in all cases

----------------------------------------------------------------------
Currently the variables that are downscaled are:
1) daily precipitation accumulation
2) daily maximum temperature
3) daily minimum temperature

There are some files with names like:
prcp_mean_1981_2010.nc
temp_mean_1981_2010.nc
prcp_mean_2046_2065.nc
temp_mean_2046_2065.nc
These files have time averages over the range of years indicated in the file name. There is a separate time average for each of the 12 calendar months. Some averaging time periods overlap the transition from "historical" to "rcp" scenarios (2005-2006, which occurs at the end of 2005. In these cases, the "historical" and "rcp85" are always used for the portion of the time period not in the scenario where the file resides. We choose rcp85 because all models submitted to this scenario. We only do this special averaging for times near the start of the future scenarios, which is when the differences in climate between scenarios are very small.

Similarly, there are files like:
prcp_cdf_1981_2010.nc
temp_cdf_1981_2010.nc
These files have the time average cumulative distribution function (CDF). There is a separate time average for each of the 12 calendar months. These files can be used to find the typical number of days greater than or less than a particular value without having to go through all the daily data. There is a dimension called "lev" in these files which is the temperature (in C) or precipitation (in mm) at which the CDF is evaluated. In order to give more precision to the high precipitation events, the precipitation data is actually given in terms of the complementary CDF instead of the CDF (complementary CDF = 1 - CDF). Also, note that the "lev" dimension in the precipitation files is not regular (there is more precision at low values of "lev" and less at high values).

Similarly, there are files like:
prcp_annual_max_cdf_2006_2100.nc
These give the CDF of the annual maximum precipitation for each year in the scenario. The annual maximum varies with year, so at least 20-30 year averages of these fields are needed for robust statistics for extreme events. A geometric rather than arithmetic mean is best for averaging the CDFs.

There are some files like:
prcp_02_2054.nc
prcp_02_2055.nc
prcp_02_2056.nc
prcp_02_2057.nc
The 2 digit number is the "realization" (see below) and the 4 digit number is the year. These files have the daily data for the year indicated.

----------------------------------------------------------------------
Realizations: Our downscaling method predicts the Probability Density Function (PDF) for each day and grid point given the large-scale from the global climate model. (This takes into account that there's no exact relationship between the large-scale atmospheric state and the weather at a point. Instead, the large-scale determines the relative likelihood of certain events at a point.) To generate a time series of data given the PDFs, we draw random numbers from the PDFs. Because there are many different possibilities given the PDFs, we generate multiple random data sets from our PDFs. We call each of these random datasets a "realization". Currently, we have generated 3 realizations for temperature and 14 realizations for precipitation. Also, the time averages and the time average CDFs described above are not from individual realizations, instead they are averages over all possible realizations (i.e. they are calculated directly from the raw PDFs). Hence, they are less subject to sampling noise.

----------------------------------------------------------------------
Details about the data packing:
The data has been packed into short integers (2 bytes instead of 4 byte reals) to save space. You must unpack that data to get the correct floating point representation of the data. Each netCDF variable that has been packed has an add_offset and scale_factor attribute associated with it. Some software automatically unpacks the data when it is read.

The formula to unpack the data is:

unpacked value = add_offset + ( (packed value) * scale_factor )

For more information see here:
https://www.unidata.ucar.edu/software/netcdf/workshops/2010/bestpractices/Packing.html

There's also another attribute called "missing_value". In this case all the -32768 values you see are missing. Only the grid points outside the downscaling domain is given the missing data value.

The packing saves a lot of space, that is why the data is packed.

----------------------------------------------------------------------
If you have any questions contact:
David Lorenz
dlorenz@wisc.edu
608-262-1956
