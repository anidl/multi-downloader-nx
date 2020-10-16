const yaml = require('yaml');
const fs = require('fs');
const existsFile = fs.existsSync;

const loadYamlFile = (file) => {
    return yaml.parse(fs.readFileSync(file, 'utf8'));
}

const loadYamlCfg = (file) => {
    if(existsFile(`${file}.user.yml`)){
        file += '.user';
    }
    file += '.yml';
    if(fs.existsSync(file)){
        
        try{
            return loadYamlFile(file, 'utf8');
        }
        catch(e){
            return {};
        }
    }
    return {};
}

module.exports = loadYamlCfg;
