All the data is in the new netCDF-4/HDF5 format which allows data compression. If you only have netcdf-3 or the basic netcdf-4 without HDF then you won't be able to read the files. Instead, get the lastest version of your software.

A list of software that can read netcdf can be found here:
http://www.unidata.ucar.edu/software/netcdf/software.html

----------------------------------------------------------------------
The format of the directories is as follows:

scenario/climate_model/

where "scenario" is either: 20c30, sresa1b, sresa2, or sresb1
and "climate_model" is one of 13 climate models that submitted enough daily data for the downscaling (the sresa2 scenario has only 9 available models). More information on the models is here: 
http://www-pcmdi.llnl.gov/ipcc/model_documentation/ipcc_model_documentation.php

----------------------------------------------------------------------
Currently the variables that are downscaled are:
1) daily precipitation accumulation
2) daily maximum temperature
3) daily minimum temperature

There are some files with names like:
prcp_mean_1961_2000.nc
temp_mean_1961_2000.nc
prcp_mean_2046_2065.nc
temp_mean_2046_2065.nc
These files have time averages over the range of years indicated in the file name. There is a separate time average for each of the 12 calendar months.

Similarly, there are files like:
prcp_cdf_1961_2000.nc
temp_cdf_1961_2000.nc
These files have the time average cumulative distribution function (CDF). There is a separate time average for each of the 12 calendar months. These files can be used to find the typical number of days greater than or less than a particular value without having to go through all the daily data. There is a dimension called "lev" in these files which is the temperature (in C) or precipitation (in mm) at which the CDF is evaluated. In order to give more precision to the high precipitation events, the precipitation data is actually given in terms of the complementary CDF instead of the CDF (complementary CDF = 1 - CDF). Also, note that the "lev" dimension in the precipitation files is not regular (there is more precision at low values of "lev" and less at high values).

There are some files like:
prcp_02_2054.nc
prcp_02_2055.nc
prcp_02_2056.nc
prcp_02_2057.nc
The 2 digit number is the "realization" (see below) and the 4 digit number is the year. These files have the daily data for the year indicated. The data periods are not continuous. The only available time periods are 1961-2000, 2046-2065, 2081-2100. (This is not our choice, the climate models only give daily data in these time periods. The new CMIP5 models will correct this deficiency.)

----------------------------------------------------------------------
Realizations: Our downscaling method predicts the Probability Density Function (PDF) for each day and grid point given the large-scale from the global climate model. (This takes into account that there's no exact relationship between the large-scale atmospheric state and the weather at a point. Instead, the large-scale determines the relative likelihood of certain events at a point.) To generate a time series of data given the PDFs, we draw random numbers from the PDFs. Because there are many different possibilities given the PDFs, we generate multiple random data sets from our PDFs. We call each of these random datasets a "realization". Currently, we have generated 3 realizations. Also, the time averages and the time average CDFs described above are not from individual realizations, instead they are averages over all possible realizations (i.e. they are calculated directly from the raw PDFs). Hence, they are less subject to sampling noise.

----------------------------------------------------------------------
Details about the data packing:
The data has been packed into short integers (2 bytes instead of 4 byte reals) to save space. You must unpack that data to get the correct floating point representation of the data. Each netCDF variable that has been packed has an add_offset and scale_factor attribute associated with it.

The formula to unpack the data is:

unpacked value = add_offset + ( (packed value) * scale_factor )

For more information see here:
http://www.unidata.ucar.edu/software/netcdf/docs/netcdf/Attribute-Conventions.html

There's also another attribute called "missing_value". In this case all the -32768 values you see are missing. Only the grid points outside the downscaling domain is given the missing data value.

The packing saves a lot of space, that is why the data is packed.

----------------------------------------------------------------------
If you have any questions contact:
David Lorenz
dlorenz@wisc.edu
608-262-1956
