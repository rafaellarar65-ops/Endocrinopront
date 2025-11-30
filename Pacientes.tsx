      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, CPF ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Pacientes List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando pacientes...</p>
          </div>
        ) : filteredPacientes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm ? "Nenhum paciente encontrado com esse termo de busca" : "Nenhum paciente cadastrado ainda"}
              </p>
              {!searchTerm && (
                <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Paciente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPacientes.map((paciente) => (
              <Card 
                key={paciente.id} 
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation(`/pacientes/${paciente.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{paciente.nome}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-1">
                          {paciente.cpf && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {paciente.cpf}
                            </span>
                          )}
                          {paciente.dataNascimento && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(paciente.dataNascimento).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {paciente.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {paciente.email}
                      </span>
                    )}
                    {paciente.contatoWhatsapp && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {paciente.contatoWhatsapp}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
